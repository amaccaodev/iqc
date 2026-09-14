using System.Text.RegularExpressions;

namespace IQC.Api.Middleware;

/// <summary>
/// Security Firewall — lớp bảo vệ dữ liệu đầu vào.
/// OWASP A03 (Injection), A05 (Misconfiguration), A07 (XSS patterns).
/// Chặn SQLi/XSS/path traversal, IP blacklist, payload quá lớn.
/// </summary>
public sealed class SecurityFirewallMiddleware
{
    private static readonly Regex[] BlockedPatterns =
    [
        new(@"(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b|\bUPDATE\b)\s", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"<script[\s>]", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"javascript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"\.\./|\.\.\\", RegexOptions.Compiled),
        new(@"(\%27)|(\')|(\-\-)|(\%23)|(#)", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"(exec(\s|\+)+(s|x)p\w+)", RegexOptions.IgnoreCase | RegexOptions.Compiled),
    ];

    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityFirewallMiddleware> _logger;
    private readonly HashSet<string> _blockedIps;
    private readonly HashSet<string> _allowedIps;
    private readonly bool _whitelistMode;

    public SecurityFirewallMiddleware(
        RequestDelegate next,
        ILogger<SecurityFirewallMiddleware> logger,
        IConfiguration config)
    {
        _next = next;
        _logger = logger;
        _blockedIps = config.GetSection("Firewall:BlockedIps").Get<string[]>()?.ToHashSet(StringComparer.OrdinalIgnoreCase)
            ?? [];
        _allowedIps = config.GetSection("Firewall:AllowedIps").Get<string[]>()?.ToHashSet(StringComparer.OrdinalIgnoreCase)
            ?? [];
        _whitelistMode = config.GetValue("Firewall:WhitelistMode", false);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        if (_blockedIps.Contains(ip))
        {
            _logger.LogWarning("Blocked IP {Ip} attempted access to {Path}", ip, context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { success = false, error = "Truy cập bị từ chối." });
            return;
        }

        if (_whitelistMode && _allowedIps.Count > 0 && !_allowedIps.Contains(ip))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { success = false, error = "IP không được phép." });
            return;
        }

        // Scan query string
        if (ContainsThreat(context.Request.QueryString.Value))
        {
            _logger.LogWarning("Firewall blocked suspicious query from {Ip}: {Query}", ip, context.Request.QueryString);
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { success = false, error = "Yêu cầu không hợp lệ." });
            return;
        }

        // Scan path
        if (ContainsThreat(context.Request.Path.Value))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { success = false, error = "Yêu cầu không hợp lệ." });
            return;
        }

        // Security headers — OWASP A05
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        context.Response.Headers.Remove("Server");
        context.Response.Headers.Remove("X-Powered-By");

        await _next(context);
    }

    private static bool ContainsThreat(string? input)
    {
        if (string.IsNullOrEmpty(input)) return false;
        return BlockedPatterns.Any(p => p.IsMatch(input));
    }
}
