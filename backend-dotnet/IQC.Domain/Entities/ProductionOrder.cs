using IQC.Domain.Common;
using IQC.Domain.Enums;

namespace IQC.Domain.Entities;

public class ProductionOrder : BaseEntity
{
    public string OrderNo { get; set; } = "";
    public string? ProductId { get; set; }
    public string ProductLine { get; set; } = "";
    public string Customer { get; set; } = "";
    public int TargetQty { get; set; }
    public string Deadline { get; set; } = "";
    public PriorityLevel Priority { get; set; } = PriorityLevel.Normal;
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    public bool PendingApproval { get; set; }
    public string? Shift { get; set; }
    public string? Note { get; set; }

    public ICollection<OrderBom> Boms { get; set; } = [];
    public ICollection<OrderAttachment> Attachments { get; set; } = [];
    public ICollection<OrderAuditLog> AuditLogs { get; set; } = [];
}

public class OrderBom : BaseEntity
{
    public string ProductionOrderId { get; set; } = "";
    public ProductionOrder ProductionOrder { get; set; } = null!;
    public string BomCode { get; set; } = "";
    public string PartCode { get; set; } = "";
    public string PartName { get; set; } = "";
    public string RawMaterial { get; set; } = "";
    public string Machine { get; set; } = "";
    public string Process { get; set; } = "";
    public string? CatalogBomId { get; set; }
    public string? CatalogProcessId { get; set; }
    public int TargetQty { get; set; }
    public int PassQty { get; set; }
    public int FailQty { get; set; }
    public string? AssignedGroupId { get; set; }
    public string AssignedGroupName { get; set; } = "";
    public string AssignedWorkersJson { get; set; } = "[]";
    public BomStatus Status { get; set; } = BomStatus.Unassigned;
    public string SpecColsJson { get; set; } = "[]";
    public string? MaterialSpecsJson { get; set; }
    public string TechNote { get; set; } = "";

    public ICollection<WorkerEntry> WorkerEntries { get; set; } = [];
    public TeamSummary? TeamSummary { get; set; }
    public QcReport? QcReport { get; set; }
}

public class OrderAttachment : BaseEntity
{
    public string OrderId { get; set; } = "";
    public string Name { get; set; } = "";
    public AttachmentType Type { get; set; }
    public string Size { get; set; } = "";
    public string UploadedBy { get; set; } = "";
}

public class WorkerEntry : BaseEntity
{
    public string BomId { get; set; } = "";
    public OrderBom Bom { get; set; } = null!;
    public string WorkerId { get; set; } = "";
    public string WorkerName { get; set; } = "";
    public ICollection<WorkerEntryRow> Rows { get; set; } = [];
}

public class WorkerEntryRow : BaseEntity
{
    public string EntryId { get; set; } = "";
    public WorkerEntry Entry { get; set; } = null!;
    public int Tt { get; set; }
    public string DimsJson { get; set; } = "[]";
    public string NgoaiQuan { get; set; } = "";
}

public class TeamSummary : BaseEntity
{
    public string BomId { get; set; } = "";
    public OrderBom Bom { get; set; } = null!;
    public int PassQty { get; set; }
    public int FailQty { get; set; }
    public string Note { get; set; } = "";
    public string SubmittedById { get; set; } = "";
    public string SubmittedByName { get; set; } = "";
}

public class QcReport : BaseEntity
{
    public string BomId { get; set; } = "";
    public OrderBom Bom { get; set; } = null!;
    public int PassQty { get; set; }
    public int FailQty { get; set; }
    public string Note { get; set; } = "";
    public string SubmittedById { get; set; } = "";
    public string SubmittedByName { get; set; } = "";
    public bool Passed { get; set; }
}

public class OrderAuditLog : BaseEntity
{
    public string OrderId { get; set; } = "";
    public string Action { get; set; } = "";
    public string Detail { get; set; } = "";
    public string ActorId { get; set; } = "";
    public string ActorName { get; set; } = "";
}

public class ShiftClose : BaseEntity
{
    public string OrderId { get; set; } = "";
    public string BomId { get; set; } = "";
    public string WorkerId { get; set; } = "";
    public string WorkerName { get; set; } = "";
    public int PassQty { get; set; }
    public int FailQty { get; set; }
    public ShiftCloseStatus Status { get; set; } = ShiftCloseStatus.PendingTeamlead;
    public string Stage { get; set; } = "teamlead";
    public string? HistoryJson { get; set; }
    public string? Note { get; set; }
}

public class ShiftUnlockRequest : BaseEntity
{
    public string OrderId { get; set; } = "";
    public string BomId { get; set; } = "";
    public string WorkerId { get; set; } = "";
    public string WorkerName { get; set; } = "";
    public string Reason { get; set; } = "";
    public string Status { get; set; } = "pending";
    public string? ReviewedById { get; set; }
    public string? ReviewedName { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
}

public class EmployeeProductRate : BaseEntity
{
    public string UserId { get; set; } = "";
    public string ProductId { get; set; } = "";
    public decimal RateVnd { get; set; }
}

public class Notification : BaseEntity
{
    public string UserId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string Type { get; set; } = "order";
    public string? Link { get; set; }
    public bool Read { get; set; }
}

public class MachineIncident : BaseEntity
{
    public string? OrderId { get; set; }
    public string? BomId { get; set; }
    public string MachineName { get; set; } = "";
    public string Severity { get; set; } = "medium";
    public string Status { get; set; } = "open";
    public string Description { get; set; } = "";
    public string ReportedById { get; set; } = "";
    public string ReportedByName { get; set; } = "";
    public string? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
}
