using IQC.Domain.Common;
using IQC.Domain.Enums;

namespace IQC.Domain.Entities;

public class Product : BaseEntity
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string? UnitOfMeasureId { get; set; }
    public bool Active { get; set; } = true;
    public ICollection<SemiProduct> SemiProducts { get; set; } = [];
    public ICollection<ProductAttachment> Attachments { get; set; } = [];
}

public class SemiProduct : BaseEntity
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string ProductId { get; set; } = "";
    public Product Product { get; set; } = null!;
    public string? UnitOfMeasureId { get; set; }
    public decimal? WeightKg { get; set; }
    public string? DrawingId { get; set; }
    /// <summary>JSON map field → measurement type</summary>
    public string MeasurementSpecsJson { get; set; } = "{}";
    public bool Active { get; set; } = true;
    public ICollection<PartBom> Boms { get; set; } = [];
    public ICollection<SemiProductAttachment> Attachments { get; set; } = [];
}

public class PartBom : BaseEntity
{
    public string Name { get; set; } = "";
    public string SemiProductId { get; set; } = "";
    public SemiProduct SemiProduct { get; set; } = null!;
    public ICollection<BomProcess> Processes { get; set; } = [];
}

public class BomProcess : BaseEntity
{
    public string BomId { get; set; } = "";
    public PartBom Bom { get; set; } = null!;
    public string Name { get; set; } = "";
    public string? ProductionTeamId { get; set; }
    public string? MachineGroupId { get; set; }
    public int QuotaPerShift { get; set; }
    public string? UnitOfMeasureId { get; set; }
    public int SortOrder { get; set; }
}

public class MachineGroup : BaseEntity
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? ProductionTeamId { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Machine> Machines { get; set; } = [];
}

public class Machine : BaseEntity
{
    public string Name { get; set; } = "";
    public string AccountingCode { get; set; } = "";
    public string? MachineGroupId { get; set; }
    public MachineGroup? MachineGroup { get; set; }
    public string SpecsJson { get; set; } = "{}";
    public string? ProductionTeamId { get; set; }
    public bool Active { get; set; } = true;
}

public class WarehouseStock : BaseEntity
{
    public string WarehouseId { get; set; } = "default";
    public StockItemKind ItemKind { get; set; }
    public string ItemId { get; set; } = "";
    public int Qty { get; set; }
}

public class WarehouseMovement : BaseEntity
{
    public string WarehouseId { get; set; } = "default";
    public StockItemKind ItemKind { get; set; }
    public string ItemId { get; set; } = "";
    public int Delta { get; set; }
    public int QtyAfter { get; set; }
    public string? Note { get; set; }
}

public class ProductAttachment : BaseEntity
{
    public string ProductId { get; set; } = "";
    public string Name { get; set; } = "";
    public AttachmentType Type { get; set; }
    public string Size { get; set; } = "";
    public string ContentBase64 { get; set; } = "";
}

public class SemiProductAttachment : BaseEntity
{
    public string SemiProductId { get; set; } = "";
    public string Name { get; set; } = "";
    public AttachmentType Type { get; set; }
    public string Size { get; set; } = "";
    public string ContentBase64 { get; set; } = "";
}

public class MachineChangeRequest : BaseEntity
{
    public string? OrderId { get; set; }
    public string? BomId { get; set; }
    public string RequestedById { get; set; } = "";
    public string RequestedName { get; set; } = "";
    public string Reason { get; set; } = "";
    public string Kind { get; set; } = "change_machine";
    public string Target { get; set; } = "teamlead";
    public string FromMachine { get; set; } = "";
    public string ToMachine { get; set; } = "";
    public string Status { get; set; } = "pending";
    public string? ReviewedById { get; set; }
    public string? ReviewedName { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string ReviewNote { get; set; } = "";
}
