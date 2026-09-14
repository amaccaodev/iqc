namespace IQC.Application.DTOs.Users;

public sealed record RoleDto(string Id, string Label, string Description, string? CreatedAt);
public sealed record CreateRoleRequest(string Id, string Label, string Description);
public sealed record UpdateRoleRequest(string Label, string Description);

public sealed record GroupDto(
    string Id,
    string Name,
    string Lead,
    string LeadShort,
    string Description,
    bool Active,
    IReadOnlyList<GroupMemberDto> Members);

public sealed record GroupMemberDto(string UserId, string Name, bool IsLead);
public sealed record CreateGroupRequest(string Id, string Name, string Lead, string LeadShort, string Description);
public sealed record UpdateGroupRequest(string Name, string Lead, string LeadShort, string Description, bool Active);

public sealed record CreateUserRequest(
    string Id,
    string EmployeeId,
    string Name,
    string Password,
    string Role,
    string TeamId,
    string Department,
    string Phone);

public sealed record UpdateUserRequest(
    string? Name,
    string? Department,
    string? Phone,
    string? TeamId,
    bool? Active);

public sealed record AssignRoleRequest(string RoleId);
public sealed record AssignGroupRequest(string GroupId, bool IsLead);
