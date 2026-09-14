using IQC.Application.Common;
using IQC.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IQC.Api.Controllers;

[Route("api/users")]
[Authorize]
public sealed class UsersController : BaseController
{
    private readonly IUserService _users;

    public UsersController(IUserService users) => _users = users;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var q = ParseListQuery();
        if (WantsPagedList())
        {
            var (items, total) = await _users.ListPagedAsync(q.SafePage, q.SafePageSize, q.Q, ct);
            return OkApi(new PagedResult<object>
            {
                Items = items.Cast<object>().ToList(),
                Page = q.SafePage,
                PageSize = q.SafePageSize,
                Total = total
            });
        }
        var all = await _users.ListAllAsync(ct);
        return OkApi(all);
    }
}
