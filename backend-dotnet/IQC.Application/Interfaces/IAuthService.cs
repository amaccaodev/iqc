using IQC.Application.DTOs.Auth;
using IQC.Application.DTOs.Catalog;
using IQC.Application.DTOs.Orders;

namespace IQC.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, string ip, string userAgent, CancellationToken ct = default);
    Task<RefreshResponse> RefreshAsync(string refreshToken, string ip, CancellationToken ct = default);
    Task LogoutAsync(string? refreshToken, string? accessToken, CancellationToken ct = default);
    Task<UserDto?> GetMeAsync(string userId, CancellationToken ct = default);
    Task ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<DeviceRequestDto>> ListPendingDevicesAsync(string reviewerId, CancellationToken ct = default);
    Task ReviewDeviceAsync(string reviewerId, string requestId, bool approve, CancellationToken ct = default);
}

public interface IUserService
{
    Task<(IReadOnlyList<UserDto> Items, int Total)> ListPagedAsync(int page, int pageSize, string? q, CancellationToken ct = default);
    Task<IReadOnlyList<UserDto>> ListAllAsync(CancellationToken ct = default);
}

public interface IOrderService
{
    Task<(IReadOnlyList<ProductionOrderDto> Items, int Total)> ListPagedAsync(int page, int pageSize, string? q, string? status, CancellationToken ct = default);
    Task<ProductionOrderDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<OrderStatsDto> GetStatsAsync(CancellationToken ct = default);
}

public interface ICatalogService
{
    Task<(IReadOnlyList<ProductDto> Items, int Total)> ListProductsPagedAsync(int page, int pageSize, string? q, CancellationToken ct = default);
    Task<ProductDto?> GetProductAsync(string id, CancellationToken ct = default);
}

public interface ISpecValidationService
{
    Task<object> ValidateAsync(object payload, CancellationToken ct = default);
}
