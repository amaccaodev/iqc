using System.Text.Json;
using IQC.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;

namespace IQC.Infrastructure.Caching;

/// <summary>
/// Hybrid cache: Redis khi có connection string, fallback MemoryCache.
/// Hỗ trợ load balancer — cache shared qua Redis.
/// </summary>
public sealed class CacheService : ICacheService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private readonly IDistributedCache? _distributed;
    private readonly IMemoryCache _memory;
    private readonly bool _useRedis;

    public CacheService(IMemoryCache memory, IDistributedCache? distributed = null)
    {
        _memory = memory;
        _distributed = distributed;
        _useRedis = distributed is not null;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        if (_useRedis && _distributed is not null)
        {
            var bytes = await _distributed.GetAsync(key, ct);
            if (bytes is null) return default;
            return JsonSerializer.Deserialize<T>(bytes, JsonOpts);
        }

        return _memory.TryGetValue(key, out T? val) ? val : default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        var ttl = expiry ?? TimeSpan.FromMinutes(5);

        if (_useRedis && _distributed is not null)
        {
            var bytes = JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts);
            await _distributed.SetAsync(key, bytes, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl
            }, ct);
            return;
        }

        _memory.Set(key, value, ttl);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        if (_useRedis && _distributed is not null)
            await _distributed.RemoveAsync(key, ct);
        _memory.Remove(key);
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        // MemoryCache không hỗ trợ prefix — invalidate known keys trong service layer
        return Task.CompletedTask;
    }
}
