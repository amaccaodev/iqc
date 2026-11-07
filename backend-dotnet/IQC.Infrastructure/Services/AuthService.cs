using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using IQC.Application.DTOs.Auth;
using IQC.Application.Interfaces;
using IQC.Domain.Entities;
using IQC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace IQC.Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private readonly IqcDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;
    private readonly ICacheService _cache;

    public AuthService(IqcDbContext db, IConfiguration config, ILogger<AuthService> logger, ICacheService cache)
    {
        _db = db;
        _config = config;
        _logger = logger;
        _cache = cache;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, string ip, string userAgent, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.GroupMembers)
            .FirstOrDefaultAsync(u => u.EmployeeId == request.EmployeeId && u.Active, ct)
            ?? throw new UnauthorizedAccessException("Sai mã NV hoặc mật khẩu.");

        if (!VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Sai mã NV hoặc mật khẩu.");

        var role = user.UserRoles.FirstOrDefault()?.RoleId ?? "worker";
        var teamId = user.GroupMembers.FirstOrDefault()?.GroupId ?? "";

        // Mobile device approval flow
        var isMobile = userAgent.Contains("Mobile", StringComparison.OrdinalIgnoreCase);
        if (isMobile && !string.IsNullOrEmpty(request.DeviceId))
        {
            var pending = await _db.DeviceLoginRequests
                .AnyAsync(d => d.UserId == user.Id && d.Status == "pending", ct);
            if (pending)
            {
                return new LoginResponse(
                    MapUser(user, role, teamId),
                    null,
                    "pending_device",
                    null);
            }
        }

        var (accessToken, refreshToken) = await CreateSessionAsync(user, role, teamId, ip, userAgent, ct);

        _logger.LogInformation("Login success {EmployeeId} from {Ip}", user.EmployeeId, ip);

        return new LoginResponse(MapUser(user, role, teamId), accessToken, "ok", null, refreshToken);
    }

    public async Task<RefreshResponse> RefreshAsync(string refreshToken, string ip, CancellationToken ct = default)
    {
        var hash = HashToken(refreshToken);
        var session = await _db.AuthSessions
            .FirstOrDefaultAsync(s => s.RefreshTokenHash == hash && !s.Revoked && s.ExpiresAt > DateTimeOffset.UtcNow, ct)
            ?? throw new UnauthorizedAccessException("Refresh token không hợp lệ.");

        var user = await _db.Users
            .Include(u => u.UserRoles)
            .Include(u => u.GroupMembers)
            .FirstOrDefaultAsync(u => u.Id == session.UserId, ct)
            ?? throw new UnauthorizedAccessException("Không tìm thấy tài khoản.");

        session.Revoked = true;
        var role = user.UserRoles.FirstOrDefault()?.RoleId ?? "worker";
        var teamId = user.GroupMembers.FirstOrDefault()?.GroupId ?? "";
        var (accessToken, newRefresh) = await CreateSessionAsync(user, role, teamId, ip, session.UserAgent ?? "", ct);
        await _db.SaveChangesAsync(ct);

        return new RefreshResponse(MapUser(user, role, teamId), accessToken, "ok");
    }

    public async Task LogoutAsync(string? refreshToken, string? accessToken, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(refreshToken))
        {
            var hash = HashToken(refreshToken);
            var session = await _db.AuthSessions.FirstOrDefaultAsync(s => s.RefreshTokenHash == hash, ct);
            if (session is not null) session.Revoked = true;
        }
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Logout");
    }

    public async Task<UserDto?> GetMeAsync(string userId, CancellationToken ct = default)
    {
        var cached = await _cache.GetAsync<UserDto>($"user:{userId}", ct);
        if (cached is not null) return cached;

        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.GroupMembers)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return null;

        var dto = MapUser(user, user.UserRoles.FirstOrDefault()?.RoleId ?? "worker",
            user.GroupMembers.FirstOrDefault()?.GroupId ?? "");
        await _cache.SetAsync($"user:{userId}", dto, TimeSpan.FromMinutes(10), ct);
        return dto;
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync([userId], ct)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản.");
        if (!VerifyPassword(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Mật khẩu hiện tại không đúng.");
        user.PasswordHash = HashPassword(request.NewPassword);
        await _db.SaveChangesAsync(ct);
        await _cache.RemoveAsync($"user:{userId}", ct);
    }

    public async Task<IReadOnlyList<DeviceRequestDto>> ListPendingDevicesAsync(string reviewerId, CancellationToken ct = default)
    {
        var items = await _db.DeviceLoginRequests
            .Where(d => d.Status == "pending")
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(ct);

        var result = new List<DeviceRequestDto>();
        foreach (var d in items)
        {
            var user = await _db.Users.FindAsync([d.UserId], ct);
            result.Add(new DeviceRequestDto(
                d.Id, d.UserId, user?.Name ?? "", d.Status,
                d.IpAddress, d.UserAgent, d.CreatedAt.ToString("O")));
        }
        return result;
    }

    public async Task ReviewDeviceAsync(string reviewerId, string requestId, bool approve, CancellationToken ct = default)
    {
        var req = await _db.DeviceLoginRequests.FindAsync([requestId], ct)
            ?? throw new KeyNotFoundException("Không tìm thấy yêu cầu.");
        req.Status = approve ? "approved" : "rejected";
        req.ReviewedById = reviewerId;
        req.ReviewedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    private async Task<(string AccessToken, string RefreshToken)> CreateSessionAsync(
        User user, string role, string teamId, string ip, string userAgent, CancellationToken ct)
    {
        var accessToken = GenerateJwt(user, role, teamId);
        var refreshToken = $"rt-{Guid.NewGuid():N}";

        var session = new AuthSession
        {
            UserId = user.Id,
            RefreshTokenHash = HashToken(refreshToken),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(180),
            IpAddress = ip,
            UserAgent = userAgent,
            CreatedById = user.Id,
            CreatedByName = user.Name
        };
        _db.AuthSessions.Add(session);
        await _db.SaveChangesAsync(ct);
        return (accessToken, refreshToken);
    }

    private string GenerateJwt(User user, string role, string teamId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Secret"] ?? "iqc-dev-secret-change-in-production-min-32-chars!!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Name, user.Name),
            new Claim(ClaimTypes.Role, role),
            new Claim("team_id", teamId),
            new Claim("employee_id", user.EmployeeId)
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "iqc-api",
            audience: _config["Jwt:Audience"] ?? "iqc-client",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapUser(User user, string role, string teamId) =>
        new(user.Id, user.EmployeeId, user.Name, role, teamId,
            user.Department, user.Phone, user.Active,
            user.CreatedAt.ToString("O"), user.CreatedById, user.CreatedByName);

    public static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static bool VerifyPassword(string password, string hash) =>
        HashPassword(password) == hash;

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
