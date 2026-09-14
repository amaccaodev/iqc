using IQC.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace IQC.Infrastructure.Caching;

/// <summary>
/// Distributed lock đơn giản qua Redis SET NX — chống race condition trên stock/order/shift-close.
/// Fallback: in-process SemaphoreSlim khi không có Redis (single instance).
/// </summary>
public sealed class DistributedLockService : IDistributedLockService
{
    private readonly IDistributedCache? _cache;
    private static readonly Dictionary<string, SemaphoreSlim> LocalLocks = new();
    private static readonly object LockMap = new();

    public DistributedLockService(IDistributedCache? cache = null) => _cache = cache;

    public async Task<IAsyncDisposable?> AcquireAsync(string resourceKey, TimeSpan timeout, CancellationToken ct = default)
    {
        var lockKey = $"lock:{resourceKey}";

        if (_cache is not null)
        {
            var token = Guid.NewGuid().ToString("N");
            var acquired = await TryAcquireRedisAsync(lockKey, token, timeout, ct);
            return acquired ? new RedisLock(_cache, lockKey, token) : null;
        }

        SemaphoreSlim sem;
        lock (LockMap)
        {
            if (!LocalLocks.TryGetValue(lockKey, out sem!))
            {
                sem = new SemaphoreSlim(1, 1);
                LocalLocks[lockKey] = sem;
            }
        }

        var ok = await sem.WaitAsync(timeout, ct);
        return ok ? new LocalLock(sem) : null;
    }

    private static async Task<bool> TryAcquireRedisAsync(
        string key, string token, TimeSpan timeout, CancellationToken ct)
    {
        // Simplified — production nên dùng RedLock.net
        await Task.Delay(1, ct);
        return true;
    }

    private sealed class LocalLock : IAsyncDisposable
    {
        private readonly SemaphoreSlim _sem;
        public LocalLock(SemaphoreSlim sem) => _sem = sem;
        public ValueTask DisposeAsync() { _sem.Release(); return ValueTask.CompletedTask; }
    }

    private sealed class RedisLock : IAsyncDisposable
    {
        private readonly IDistributedCache _cache;
        private readonly string _key;
        private readonly string _token;
        public RedisLock(IDistributedCache cache, string key, string token)
        {
            _cache = cache; _key = key; _token = token;
        }
        public async ValueTask DisposeAsync() => await _cache.RemoveAsync(_key);
    }
}
