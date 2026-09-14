using IQC.Application.Interfaces;
using IQC.Domain.Common;
using IQC.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace IQC.Infrastructure.Data;

public sealed class IqcDbContext : DbContext
{
    private readonly ICurrentUserService _currentUser;
    private IDbContextTransaction? _transaction;

    public IqcDbContext(DbContextOptions<IqcDbContext> options, ICurrentUserService currentUser)
        : base(options)
    {
        _currentUser = currentUser;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<AuthSession> AuthSessions => Set<AuthSession>();
    public DbSet<DeviceLoginRequest> DeviceLoginRequests => Set<DeviceLoginRequest>();

    public DbSet<Product> Products => Set<Product>();
    public DbSet<SemiProduct> SemiProducts => Set<SemiProduct>();
    public DbSet<PartBom> PartBoms => Set<PartBom>();
    public DbSet<BomProcess> BomProcesses => Set<BomProcess>();
    public DbSet<MachineGroup> MachineGroups => Set<MachineGroup>();
    public DbSet<Machine> Machines => Set<Machine>();
    public DbSet<WarehouseStock> WarehouseStocks => Set<WarehouseStock>();
    public DbSet<WarehouseMovement> WarehouseMovements => Set<WarehouseMovement>();
    public DbSet<MachineChangeRequest> MachineChangeRequests => Set<MachineChangeRequest>();

    public DbSet<ProductionOrder> ProductionOrders => Set<ProductionOrder>();
    public DbSet<OrderBom> OrderBoms => Set<OrderBom>();
    public DbSet<WorkerEntry> WorkerEntries => Set<WorkerEntry>();
    public DbSet<WorkerEntryRow> WorkerEntryRows => Set<WorkerEntryRow>();
    public DbSet<TeamSummary> TeamSummaries => Set<TeamSummary>();
    public DbSet<QcReport> QcReports => Set<QcReport>();
    public DbSet<OrderAuditLog> OrderAuditLogs => Set<OrderAuditLog>();
    public DbSet<OrderAttachment> OrderAttachments => Set<OrderAttachment>();

    public DbSet<ShiftClose> ShiftCloses => Set<ShiftClose>();
    public DbSet<ShiftUnlockRequest> ShiftUnlockRequests => Set<ShiftUnlockRequest>();
    public DbSet<EmployeeProductRate> EmployeeProductRates => Set<EmployeeProductRate>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<MachineIncident> MachineIncidents => Set<MachineIncident>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(IqcDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditFields();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditFields()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                if (string.IsNullOrWhiteSpace(entry.Entity.Id))
                    entry.Entity.Id = Guid.NewGuid().ToString("N")[..12];
                entry.Entity.CreatedAt = now;
                entry.Entity.CreatedById ??= _currentUser.UserId;
                entry.Entity.CreatedByName ??= _currentUser.UserName;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedById = _currentUser.UserId;
                entry.Entity.UpdatedByName = _currentUser.UserName;
            }
        }
    }

    public async Task BeginTransactionAsync(CancellationToken ct = default)
    {
        _transaction ??= await Database.BeginTransactionAsync(ct);
    }

    public async Task CommitTransactionAsync(CancellationToken ct = default)
    {
        if (_transaction is null) return;
        await _transaction.CommitAsync(ct);
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public async Task RollbackTransactionAsync(CancellationToken ct = default)
    {
        if (_transaction is null) return;
        await _transaction.RollbackAsync(ct);
        await _transaction.DisposeAsync();
        _transaction = null;
    }
}
