using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace IQC.Infrastructure.Data;

/// <summary>EF Core design-time factory — dùng cho dotnet ef migrations (không chạy Program.cs).</summary>
public sealed class IqcDbContextFactory : IDesignTimeDbContextFactory<IqcDbContext>
{
    public IqcDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../IQC.Api"))
            .AddJsonFile("appsettings.json")
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        var connStr = config.GetConnectionString("DefaultConnection")
            ?? "Server=localhost;Port=3306;Database=iqc;User=iqc;Password=iqc;";

        var options = new DbContextOptionsBuilder<IqcDbContext>()
            .UseMySql(connStr, ServerVersion.Parse("8.0.36-mysql"), mySql =>
            {
                mySql.MigrationsAssembly(typeof(IqcDbContext).Assembly.FullName);
            })
            .Options;

        return new IqcDbContext(options, new DesignTimeCurrentUser());
    }

    private sealed class DesignTimeCurrentUser : Application.Interfaces.ICurrentUserService
    {
        public string? UserId => "system";
        public string? UserName => "System";
        public string? Role => "admin";
        public string? TeamId => null;
        public bool IsAuthenticated => false;
        public string? IpAddress => null;
        public string? UserAgent => null;
    }
}
