using IQC.Application.DTOs.Orders;
using IQC.Application.Interfaces;
using IQC.Domain.Enums;
using IQC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IQC.Infrastructure.Services;

public sealed class OrderService : IOrderService
{
    private readonly IqcDbContext _db;
    private readonly ICacheService _cache;
    private readonly IDistributedLockService _locks;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IqcDbContext db,
        ICacheService cache,
        IDistributedLockService locks,
        ILogger<OrderService> logger)
    {
        _db = db;
        _cache = cache;
        _locks = locks;
        _logger = logger;
    }

    public async Task<(IReadOnlyList<ProductionOrderDto> Items, int Total)> ListPagedAsync(
        int page, int pageSize, string? q, string? status, CancellationToken ct = default)
    {
        var query = _db.ProductionOrders.Include(o => o.Boms).AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(o =>
                o.OrderNo.ToLower().Contains(term) ||
                o.ProductLine.ToLower().Contains(term) ||
                o.Customer.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, true, out var st))
            query = query.Where(o => o.Status == st);

        var total = await query.CountAsync(ct);
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (orders.Select(MapOrder).ToList(), total);
    }

    public async Task<ProductionOrderDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var cached = await _cache.GetAsync<ProductionOrderDto>($"order:{id}", ct);
        if (cached is not null) return cached;

        var order = await _db.ProductionOrders
            .Include(o => o.Boms)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct);
        if (order is null) return null;

        var dto = MapOrder(order);
        await _cache.SetAsync($"order:{id}", dto, TimeSpan.FromMinutes(2), ct);
        return dto;
    }

    public async Task<OrderStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var stats = await _db.ProductionOrders
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Draft = g.Count(o => o.Status == OrderStatus.Draft),
                Pending = g.Count(o => o.Status == OrderStatus.PendingApproval),
                Approved = g.Count(o => o.Status == OrderStatus.Approved),
                InProgress = g.Count(o => o.Status == OrderStatus.InProgress),
                Completed = g.Count(o => o.Status == OrderStatus.Completed)
            })
            .FirstOrDefaultAsync(ct);

        return new OrderStatsDto(
            stats?.Total ?? 0,
            stats?.Draft ?? 0,
            stats?.Pending ?? 0,
            stats?.Approved ?? 0,
            stats?.InProgress ?? 0,
            stats?.Completed ?? 0);
    }

    private static ProductionOrderDto MapOrder(Domain.Entities.ProductionOrder o) =>
        new(
            o.Id, o.OrderNo, o.ProductId, o.ProductLine, o.Customer,
            o.TargetQty, o.Deadline, o.Priority.ToString().ToLowerInvariant(),
            o.Status.ToString().ToLowerInvariant(), o.PendingApproval,
            o.Shift, o.Note, o.CreatedAt.ToString("O"),
            o.CreatedById, o.CreatedByName,
            o.Boms.Select(b => new OrderBomDto(
                b.Id, b.BomCode, b.PartCode, b.PartName, b.Process, b.Machine,
                b.TargetQty, b.PassQty, b.FailQty,
                b.Status.ToString().ToLowerInvariant(),
                b.AssignedGroupId, b.AssignedGroupName,
                b.CatalogBomId, b.CatalogProcessId)).ToList());
}
