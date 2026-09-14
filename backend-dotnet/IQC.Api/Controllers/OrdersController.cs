using IQC.Application.Common;
using IQC.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IQC.Api.Controllers;

[Route("api/orders")]
[Authorize]
public sealed class OrdersController : BaseController
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var q = ParseListQuery();
        var status = Request.Query["status"].FirstOrDefault();

        if (WantsPagedList())
        {
            var (items, total) = await _orders.ListPagedAsync(q.SafePage, q.SafePageSize, q.Q, status, ct);
            return OkApi(new PagedResult<object>
            {
                Items = items.Cast<object>().ToList(),
                Page = q.SafePage,
                PageSize = q.SafePageSize,
                Total = total
            });
        }

        var (all, _) = await _orders.ListPagedAsync(1, 10_000, q.Q, status, ct);
        return OkApi(all);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken ct)
    {
        var stats = await _orders.GetStatsAsync(ct);
        return OkApi(stats);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct)
    {
        var order = await _orders.GetByIdAsync(id, ct);
        if (order is null) return FailApi(404, "Không tìm thấy lệnh.");
        return OkApi(order);
    }
}
