using IQC.Application.Common;
using IQC.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IQC.Api.Controllers;

[Route("api/products")]
[Authorize]
public sealed class CatalogController : BaseController
{
    private readonly ICatalogService _catalog;

    public CatalogController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet]
    public async Task<IActionResult> ListProducts(CancellationToken ct)
    {
        var q = ParseListQuery();
        if (WantsPagedList())
        {
            var (items, total) = await _catalog.ListProductsPagedAsync(q.SafePage, q.SafePageSize, q.Q, ct);
            return OkApi(new PagedResult<object>
            {
                Items = items.Cast<object>().ToList(),
                Page = q.SafePage,
                PageSize = q.SafePageSize,
                Total = total
            });
        }
        var (all, _) = await _catalog.ListProductsPagedAsync(1, 10_000, q.Q, ct);
        return OkApi(all);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(string id, CancellationToken ct)
    {
        var product = await _catalog.GetProductAsync(id, ct);
        if (product is null) return FailApi(404, "Không tìm thấy sản phẩm.");
        return OkApi(product);
    }
}
