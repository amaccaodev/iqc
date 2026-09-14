namespace IQC.Application.Common;

/// <summary>Envelope JSON tương thích frontend hiện tại: { success, data, error, message }</summary>
public sealed class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Error { get; init; }
    public string? Message { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string error) =>
        new() { Success = false, Error = error };
}

public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int Total { get; init; }
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize);
}

public static class PaginationDefaults
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;
}

public sealed class ListQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = PaginationDefaults.DefaultPageSize;
    public string? Q { get; init; }

    public int SafePageSize =>
        Math.Clamp(PageSize, 1, PaginationDefaults.MaxPageSize);

    public int SafePage => Math.Max(1, Page);
}
