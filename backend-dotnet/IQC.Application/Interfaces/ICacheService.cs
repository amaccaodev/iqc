namespace IQC.Application.Interfaces;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);
    Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default);
}

public interface IDistributedLockService
{
    /// <summary>Acquire lock — chống race condition trên cùng resource (order, stock, shift close).</summary>
    Task<IAsyncDisposable?> AcquireAsync(string resourceKey, TimeSpan timeout, CancellationToken ct = default);
}
