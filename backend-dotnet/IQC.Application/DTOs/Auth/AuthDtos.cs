namespace IQC.Application.DTOs.Auth;

public sealed record LoginRequest(string EmployeeId, string Password, string? DeviceId);

public sealed record LoginResponse(
    UserDto User,
    string? Token,
    string Status,
    string? PendingDeviceRequestId,
    string? RefreshToken = null);

public sealed record RefreshResponse(UserDto User, string Token, string Status);

public sealed record UserDto(
    string Id,
    string EmployeeId,
    string Name,
    string Role,
    string TeamId,
    string Department,
    string Phone,
    bool Active,
    string? CreatedAt,
    string? CreatedById,
    string? CreatedByName);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public sealed record DeviceRequestDto(
    string Id,
    string UserId,
    string UserName,
    string Status,
    string? IpAddress,
    string? UserAgent,
    string CreatedAt);

public sealed record ReviewDeviceRequest(bool Approve);
