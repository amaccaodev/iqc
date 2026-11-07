namespace IQC.Application.DTOs.Orders;

public sealed record ProductionOrderDto(
    string Id,
    string OrderNo,
    string? ProductId,
    string ProductLine,
    string Customer,
    int TargetQty,
    string Deadline,
    string Priority,
    string Status,
    bool PendingApproval,
    string? Shift,
    string? Note,
    string CreatedAt,
    string? CreatedById,
    string? CreatedByName,
    IReadOnlyList<OrderBomDto> Boms);

public sealed record OrderBomDto(
    string Id,
    string BomCode,
    string PartCode,
    string PartName,
    string Process,
    string Machine,
    int TargetQty,
    int PassQty,
    int FailQty,
    string Status,
    string? AssignedGroupId,
    string AssignedGroupName,
    string? CatalogBomId,
    string? CatalogProcessId);

public sealed record CreateOrderRequest(
    string OrderNo,
    string ProductLine,
    string Customer,
    int TargetQty,
    string Deadline,
    string Priority);

public sealed record CreateOrderFromProductRequest(
    string ProductId,
    int FinishedQty,
    string Deadline,
    string? Note,
    string? Priority,
    string? Customer,
    string? Shift,
    IReadOnlyList<CreateOrderLineRequest> Lines);

public sealed record CreateOrderLineRequest(
    string SemiProductId,
    int ProduceQty,
    bool UseFromStock,
    int? StockUseQty,
    IReadOnlyList<string>? ProcessIds);

public sealed record OrderStatsDto(int Total, int Draft, int PendingApproval, int Approved, int InProgress, int Completed);

public sealed record WorkerRowRequest(
    IReadOnlyList<DimensionRowDto> Rows);

public sealed record DimensionRowDto(int Tt, IReadOnlyList<string> Dims, string NgoaiQuan);

public sealed record ShiftCloseDto(
    string Id,
    string OrderId,
    string BomId,
    string WorkerId,
    string WorkerName,
    int PassQty,
    int FailQty,
    string Status,
    string Stage,
    string CreatedAt,
    string? CreatedById,
    string? CreatedByName,
    object? History);

public sealed record ReviewShiftCloseRequest(
    bool Approve,
    string? Note,
    int? PassQty,
    int? FailQty,
    string? EvidenceName,
    string? EvidenceMimeType,
    string? EvidenceBase64);
