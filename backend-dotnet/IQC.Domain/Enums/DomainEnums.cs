namespace IQC.Domain.Enums;

public enum OrderStatus
{
    Draft,
    PendingApproval,
    Approved,
    InProgress,
    Completed
}

public enum BomStatus
{
    Unassigned,
    Assigned,
    InProgress,
    TeamReported,
    QcPassed,
    QcFailed
}

public enum PriorityLevel
{
    Normal,
    High,
    Urgent
}

public enum ShiftCloseStatus
{
    PendingTeamlead,
    PendingQc,
    PendingSupervisor,
    Approved,
    Rejected
}

public enum StockItemKind
{
    Product,
    SemiProduct
}

public enum AttachmentType
{
    Pdf,
    Image,
    Cad,
    Excel,
    Word,
    Other
}
