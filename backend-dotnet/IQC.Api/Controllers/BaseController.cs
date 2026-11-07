using IQC.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace IQC.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    protected IActionResult OkApi<T>(T data, string? message = null) =>
        Ok(ApiResponse<T>.Ok(data, message));

    protected IActionResult CreatedApi<T>(T data, string? message = null) =>
        StatusCode(StatusCodes.Status201Created, ApiResponse<T>.Ok(data, message));

    protected IActionResult FailApi(int status, string error) =>
        StatusCode(status, ApiResponse<object>.Fail(error));

    protected ListQuery ParseListQuery()
    {
        var page = int.TryParse(Request.Query["page"], out var p) ? p : 1;
        var pageSize = int.TryParse(Request.Query["pageSize"], out var ps) ? ps : PaginationDefaults.DefaultPageSize;
        var q = Request.Query["q"].FirstOrDefault();
        return new ListQuery { Page = page, PageSize = pageSize, Q = q };
    }

    protected bool WantsPagedList() =>
        Request.Query.ContainsKey("page") || Request.Query.ContainsKey("pageSize");
}
