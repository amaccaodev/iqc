using IQC.Application.DTOs.Auth;
using IQC.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IQC.Api.Controllers;

[Route("api/auth")]
public sealed class AuthController : BaseController
{
    private const string RefreshCookie = "iqc_refresh";
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest body, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
        var ua = Request.Headers.UserAgent.ToString();
        var result = await _auth.LoginAsync(body, ip, ua, ct);

        // Refresh token in HttpOnly cookie — tương thích FE
        if (result.Status == "ok" && !string.IsNullOrEmpty(result.RefreshToken))
        {
            Response.Cookies.Append(RefreshCookie, result.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                MaxAge = TimeSpan.FromDays(180),
                Path = "/"
            });
        }

        return OkApi(new { user = result.User, token = result.Token, status = result.Status });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var refresh = Request.Cookies[RefreshCookie] ?? "";
        if (string.IsNullOrEmpty(refresh))
            return FailApi(401, "Không có refresh token.");

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
        var result = await _auth.RefreshAsync(refresh, ip, ct);
        return OkApi(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var bearer = Request.Headers.Authorization.ToString().Replace("Bearer ", "");
        var refresh = Request.Cookies[RefreshCookie];
        await _auth.LogoutAsync(refresh, bearer, ct);
        Response.Cookies.Delete(RefreshCookie);
        return OkApi(new { });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return FailApi(401, "Chưa đăng nhập.");

        var user = await _auth.GetMeAsync(userId, ct);
        if (user is null) return FailApi(401, "Không tìm thấy tài khoản.");
        return OkApi(user);
    }

    [HttpGet("device-requests")]
    [Authorize]
    public async Task<IActionResult> DeviceRequests(CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value ?? "";
        var data = await _auth.ListPendingDevicesAsync(userId, ct);
        return OkApi(data);
    }

    [HttpPost("device-requests/{id}/review")]
    [Authorize]
    public async Task<IActionResult> ReviewDevice(string id, [FromBody] ReviewDeviceRequest body, CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value ?? "";
        await _auth.ReviewDeviceAsync(userId, id, body.Approve, ct);
        return OkApi(new { ok = true });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest body, CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value ?? "";
        await _auth.ChangePasswordAsync(userId, body, ct);
        return OkApi(new { ok = true });
    }
}
