namespace IQC.Application.DTOs.Catalog;

public sealed record ProductDto(
    string Id,
    string Code,
    string Name,
    string Description,
    bool Active,
    string? CreatedAt,
    string? CreatedById,
    string? CreatedByName);

public sealed record CreateProductRequest(string Code, string Name, string Description);
public sealed record UpdateProductRequest(string? Code, string? Name, string? Description, bool? Active);

public sealed record SemiProductDto(
    string Id,
    string Code,
    string Name,
    string ProductId,
    Dictionary<string, string> MeasurementSpecs,
    bool Active,
    string? CreatedAt);

public sealed record CreateSemiProductRequest(
    string Code,
    string Name,
    string ProductId,
    Dictionary<string, string>? MeasurementSpecs);

public sealed record MachineDto(
    string Id,
    string Name,
    string AccountingCode,
    string? MachineGroupId,
    string? ProductionTeamId,
    bool Active);

public sealed record MachineGroupDto(string Id, string Code, string Name, string? ProductionTeamId, bool IsActive);

public sealed record WarehouseStockDto(
    string Id,
    string ItemKind,
    string ItemId,
    int Qty,
    string? UpdatedAt,
    ProductDto? Product,
    SemiProductDto? SemiProduct);

public sealed record WarehouseAdjustRequest(int Delta, string? Note);

public sealed record ImportBomRowDto(
    string ProductCode,
    string SemiProductCode,
    string BomName,
    string ProcessName,
    string? TeamId,
    string? MachineGroupCode,
    int QuotaPerShift,
    int SortOrder);
