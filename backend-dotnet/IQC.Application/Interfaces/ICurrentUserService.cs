namespace IQC.Application.Interfaces;

/// <summary>
/// Thông tin user hiện tại — tự động inject vào mọi API call đã xác thực.
/// Dùng cho audit: CreatedById, CreatedByName, UpdatedById, UpdatedByName.
/// </summary>
public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserName { get; }
    string? Role { get; }
    string? TeamId { get; }
    bool IsAuthenticated { get; }
    string? IpAddress { get; }
    string? UserAgent { get; }
}
