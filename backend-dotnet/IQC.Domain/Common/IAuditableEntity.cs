namespace IQC.Domain.Common;

public interface IAuditableEntity
{
    DateTimeOffset CreatedAt { get; set; }
    string? CreatedById { get; set; }
    string? CreatedByName { get; set; }
    DateTimeOffset? UpdatedAt { get; set; }
    string? UpdatedById { get; set; }
    string? UpdatedByName { get; set; }
}
