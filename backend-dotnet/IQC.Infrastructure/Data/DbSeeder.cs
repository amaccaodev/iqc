using IQC.Domain.Entities;
using IQC.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IQC.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IqcDbContext db, ILogger logger, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct)) return;

        logger.LogInformation("Seeding initial data...");

        var roles = new[]
        {
            new Role { Id = "director", Label = "Giám đốc", Description = "" },
            new Role { Id = "supervisor", Label = "Quản đốc", Description = "" },
            new Role { Id = "teamlead", Label = "Tổ trưởng", Description = "" },
            new Role { Id = "worker", Label = "Công nhân", Description = "" },
            new Role { Id = "qc", Label = "QC", Description = "" },
            new Role { Id = "admin", Label = "Admin", Description = "" },
        };
        db.Roles.AddRange(roles);

        var groups = new[]
        {
            new Group { Id = "t1", Name = "Tổ 1", Lead = "Tổ trưởng 1", LeadShort = "TT1" },
            new Group { Id = "t2", Name = "Tổ 2", Lead = "Tổ trưởng 2", LeadShort = "TT2" },
        };
        db.Groups.AddRange(groups);

        var users = new[]
        {
            new User { Id = "u1", EmployeeId = "GD001", Name = "Giám đốc", PasswordHash = AuthService.HashPassword("123"), Department = "BGD" },
            new User { Id = "u2", EmployeeId = "QD001", Name = "Quản đốc", PasswordHash = AuthService.HashPassword("123"), Department = "SX" },
            new User { Id = "u3", EmployeeId = "TT001", Name = "Tổ trưởng 1", PasswordHash = AuthService.HashPassword("123"), Department = "Tổ 1" },
            new User { Id = "u4", EmployeeId = "CN001", Name = "Công nhân 1", PasswordHash = AuthService.HashPassword("123"), Department = "Tổ 1" },
            new User { Id = "u5", EmployeeId = "QC001", Name = "QC 1", PasswordHash = AuthService.HashPassword("123"), Department = "QC" },
        };
        db.Users.AddRange(users);

        db.UserRoles.AddRange(
            new UserRole { UserId = "u1", RoleId = "director" },
            new UserRole { UserId = "u2", RoleId = "supervisor" },
            new UserRole { UserId = "u3", RoleId = "teamlead" },
            new UserRole { UserId = "u4", RoleId = "worker" },
            new UserRole { UserId = "u5", RoleId = "qc" });

        db.GroupMembers.AddRange(
            new GroupMember { UserId = "u3", GroupId = "t1", IsLead = true },
            new GroupMember { UserId = "u4", GroupId = "t1" });

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seed complete — demo accounts password: 123");
    }
}
