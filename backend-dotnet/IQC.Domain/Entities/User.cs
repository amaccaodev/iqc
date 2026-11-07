using IQC.Domain.Common;

namespace IQC.Domain.Entities;

public class User : BaseEntity
{
    public string EmployeeId { get; set; } = "";
    public string Name { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Department { get; set; } = "";
    public string Phone { get; set; } = "";
    public bool Active { get; set; } = true;

    public ICollection<UserRole> UserRoles { get; set; } = [];
    public ICollection<GroupMember> GroupMembers { get; set; } = [];
}

public class Role : BaseEntity
{
    public string Label { get; set; } = "";
    public string Description { get; set; } = "";
    public ICollection<UserRole> UserRoles { get; set; } = [];
}

public class UserRole
{
    public string UserId { get; set; } = "";
    public User User { get; set; } = null!;
    public string RoleId { get; set; } = "";
    public Role Role { get; set; } = null!;
    public DateTimeOffset GrantedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? GrantedBy { get; set; }
}

public class Group : BaseEntity
{
    public string Name { get; set; } = "";
    public string Lead { get; set; } = "";
    public string LeadShort { get; set; } = "";
    public string Description { get; set; } = "";
    public bool Active { get; set; } = true;
    public ICollection<GroupMember> Members { get; set; } = [];
}

public class GroupMember
{
    public string UserId { get; set; } = "";
    public User User { get; set; } = null!;
    public string GroupId { get; set; } = "";
    public Group Group { get; set; } = null!;
    public bool IsLead { get; set; }
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class AuthSession : BaseEntity
{
    public string UserId { get; set; } = "";
    public string RefreshTokenHash { get; set; } = "";
    public string? AccessTokenHash { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool Revoked { get; set; }
}

public class DeviceLoginRequest : BaseEntity
{
    public string UserId { get; set; } = "";
    public string Status { get; set; } = "pending";
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? ReviewedById { get; set; }
    public string? ReviewedByName { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
}
