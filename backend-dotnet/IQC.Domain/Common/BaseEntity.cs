namespace IQC.Domain.Common;

/// <summary>
/// Base entity — mọi bản ghi có Id + audit fields.
/// API tự động gán CreatedAt, CreatedById, CreatedByName khi SaveChanges.
/// </summary>
public abstract class BaseEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public string? CreatedById { get; set; }

    public string? CreatedByName { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public string? UpdatedById { get; set; }

    public string? UpdatedByName { get; set; }

    /// <summary>Optimistic concurrency — chống race condition khi ghi đồng thời.</summary>
    public uint RowVersion { get; set; }
}
