using System.Text;
using System.Threading.RateLimiting;
using IQC.Application.Interfaces;
using IQC.Domain.Interfaces;
using IQC.Infrastructure.Caching;
using IQC.Infrastructure.Data;
using IQC.Infrastructure.Identity;
using IQC.Infrastructure.Repositories;
using IQC.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace IQC.Api.Extensions;

public static class ServiceCollectionExtensions
{
    private static readonly ServerVersion MySqlVersion =
        ServerVersion.Parse("8.0.36-mysql");

    public static IServiceCollection AddIqcInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connStr = config.GetConnectionString("DefaultConnection")
            ?? "Server=localhost;Port=3306;Database=iqc;User=iqc;Password=iqc;";

        services.AddDbContext<IqcDbContext>(opts =>
        {
            opts.UseMySql(connStr, MySqlVersion, mySql =>
            {
                mySql.MigrationsAssembly(typeof(IqcDbContext).Assembly.FullName);
                mySql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                mySql.CommandTimeout(30);
            });
        });

        var redisConn = config.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConn))
        {
            services.AddStackExchangeRedisCache(opts => opts.Configuration = redisConn);
        }
        services.AddMemoryCache();
        services.AddSingleton<ICacheService, CacheService>();
        services.AddSingleton<IDistributedLockService, DistributedLockService>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ICatalogService, CatalogService>();

        return services;
    }

    public static IServiceCollection AddIqcAuth(this IServiceCollection services, IConfiguration config)
    {
        var secret = config["Jwt:Secret"] ?? "iqc-dev-secret-change-in-production-min-32-chars!!";
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opts =>
            {
                opts.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = config["Jwt:Issuer"] ?? "iqc-api",
                    ValidAudience = config["Jwt:Audience"] ?? "iqc-client",
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });
        services.AddAuthorization();
        return services;
    }

    public static IServiceCollection AddIqcRateLimiting(this IServiceCollection services, IConfiguration config)
    {
        var permitLimit = config.GetValue("RateLimit:PermitLimit", 100);
        var windowSec = config.GetValue("RateLimit:WindowSeconds", 60);

        services.AddRateLimiter(opts =>
        {
            opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            opts.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
            {
                var ip = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault()
                    ?? ctx.Connection.RemoteIpAddress?.ToString()
                    ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = TimeSpan.FromSeconds(windowSec),
                    QueueLimit = 0
                });
            });

            opts.AddPolicy("auth", ctx =>
            {
                var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                });
            });
        });

        return services;
    }
}
