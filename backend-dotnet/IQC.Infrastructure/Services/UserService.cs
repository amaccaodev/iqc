using IQC.Application.DTOs.Auth;
using IQC.Application.Interfaces;
using IQC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IQC.Infrastructure.Services;

public sealed class UserService : IUserService
{
    private readonly IqcDbContext _db;
    private readonly ILogger<UserService> _logger;

    public UserService(IqcDbContext db, ILogger<UserService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<(IReadOnlyList<UserDto> Items, int Total)> ListPagedAsync(
        int page, int pageSize, string? q, CancellationToken ct = default)
    {
        var query = _db.Users
            .Include(u => u.UserRoles)
            .Include(u => u.GroupMembers)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(term) ||
                u.EmployeeId.ToLower().Contains(term));
        }

        var total = await query.CountAsync(ct);
        var users = await query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = users.Select(u => new UserDto(
            u.Id, u.EmployeeId, u.Name,
            u.UserRoles.FirstOrDefault()?.RoleId ?? "worker",
            u.GroupMembers.FirstOrDefault()?.GroupId ?? "",
            u.Department, u.Phone, u.Active,
            u.CreatedAt.ToString("O"), u.CreatedById, u.CreatedByName)).ToList();

        return (items, total);
    }

    public async Task<IReadOnlyList<UserDto>> ListAllAsync(CancellationToken ct = default)
    {
        var (items, _) = await ListPagedAsync(1, 10_000, null, ct);
        return items;
    }
}
