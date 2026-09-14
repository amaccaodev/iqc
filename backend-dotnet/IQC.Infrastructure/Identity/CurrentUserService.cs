using System.Security.Claims;
using IQC.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace IQC.Infrastructure.Identity;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _http;

    public CurrentUserService(IHttpContextAccessor http) => _http = http;

    public string? UserId =>
        _http.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? _http.HttpContext?.User?.FindFirst("sub")?.Value;

    public string? UserName =>
        _http.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
        ?? _http.HttpContext?.User?.FindFirst("name")?.Value;

    public string? Role =>
        _http.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value
        ?? _http.HttpContext?.User?.FindFirst("role")?.Value;

    public string? TeamId =>
        _http.HttpContext?.User?.FindFirst("team_id")?.Value;

    public bool IsAuthenticated =>
        _http.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public string? IpAddress =>
        _http.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public string? UserAgent =>
        _http.HttpContext?.Request.Headers["User-Agent"].ToString();
}
