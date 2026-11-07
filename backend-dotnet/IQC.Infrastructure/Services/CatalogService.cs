using IQC.Application.DTOs.Catalog;
using IQC.Application.Interfaces;
using IQC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IQC.Infrastructure.Services;

public sealed class CatalogService : ICatalogService
{
    private readonly IqcDbContext _db;
    private readonly ICacheService _cache;
    private readonly ILogger<CatalogService> _logger;

    public CatalogService(IqcDbContext db, ICacheService cache, ILogger<CatalogService> logger)
    {
        _db = db;
        _cache = cache;
        _logger = logger;
    }

    public async Task<(IReadOnlyList<ProductDto> Items, int Total)> ListProductsPagedAsync(
        int page, int pageSize, string? q, CancellationToken ct = default)
    {
        var query = _db.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Code.ToLower().Contains(term));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(p => p.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto(
                p.Id, p.Code, p.Name, p.Description, p.Active,
                p.CreatedAt.ToString("O"), p.CreatedById, p.CreatedByName))
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<ProductDto?> GetProductAsync(string id, CancellationToken ct = default)
    {
        var cached = await _cache.GetAsync<ProductDto>($"product:{id}", ct);
        if (cached is not null) return cached;

        var p = await _db.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return null;

        var dto = new ProductDto(
            p.Id, p.Code, p.Name, p.Description, p.Active,
            p.CreatedAt.ToString("O"), p.CreatedById, p.CreatedByName);
        await _cache.SetAsync($"product:{id}", dto, TimeSpan.FromMinutes(5), ct);
        return dto;
    }
}
