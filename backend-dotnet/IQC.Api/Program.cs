using IQC.Api.Extensions;
using IQC.Api.Middleware;
using IQC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration)
           .Enrich.FromLogContext()
           .WriteTo.Console());

    builder.Services.AddControllers()
        .AddJsonOptions(opts =>
        {
            opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

    builder.Services.AddIqcInfrastructure(builder.Configuration);
    builder.Services.AddIqcAuth(builder.Configuration);
    builder.Services.AddIqcRateLimiting(builder.Configuration);

    var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
        ?? ["http://localhost:8443", "http://localhost:5173"];
    builder.Services.AddCors(opts =>
        opts.AddDefaultPolicy(p => p
            .WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

    builder.WebHost.ConfigureKestrel(opts =>
    {
        opts.Limits.MaxRequestBodySize = 8 * 1024 * 1024;
    });

    var app = builder.Build();

    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
            | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
    });

    app.UseSerilogRequestLogging();
    app.UseMiddleware<SecurityFirewallMiddleware>();
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseRateLimiter();
    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    var autoMigrate = builder.Configuration.GetValue("Database:AutoMigrate", false);
    if (autoMigrate || app.Environment.IsDevelopment())
    {
        await RunMigrationsWithRetryAsync(app.Services);
    }

    var port = builder.Configuration.GetValue("PORT", 3001);
    app.Urls.Add($"http://0.0.0.0:{port}");

    Log.Information("IQC API (.NET 8 + MySQL) starting on port {Port}", port);
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

static async Task RunMigrationsWithRetryAsync(IServiceProvider services)
{
    const int maxAttempts = 30;
    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IqcDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbMigration");
            await db.Database.MigrateAsync();
            await DbSeeder.SeedAsync(
                db,
                scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder"));
            logger.LogInformation("Database migrated and seeded.");
            return;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            Log.Warning(ex, "Database not ready — retry {Attempt}/{Max}", attempt, maxAttempts);
            await Task.Delay(TimeSpan.FromSeconds(2));
        }
    }
}
