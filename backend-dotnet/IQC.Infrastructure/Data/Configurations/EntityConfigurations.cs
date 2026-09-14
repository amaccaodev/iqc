using IQC.Domain.Entities;
using IQC.Domain.Enums;
using IQC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IQC.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("users");
        b.HasKey(x => x.Id);
        b.Property(x => x.EmployeeId).HasColumnName("employee_id").IsRequired();
        b.HasIndex(x => x.EmployeeId).IsUnique();
        b.Property(x => x.Name).IsRequired();
        b.Property(x => x.PasswordHash).HasColumnName("password").IsRequired();
        b.Property(x => x.Active).HasDefaultValue(true);
        b.Property(x => x.RowVersion).AsConcurrencyToken();
        b.HasIndex(x => x.Name);
        b.HasIndex(x => x.Active);
    }
}

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> b)
    {
        b.ToTable("roles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Label).IsRequired();
    }
}

public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> b)
    {
        b.ToTable("user_roles");
        b.HasKey(x => new { x.UserId, x.RoleId });
        b.Property(x => x.GrantedAt).HasColumnName("granted_at");
        b.Property(x => x.GrantedBy).HasColumnName("granted_by");
    }
}

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> b)
    {
        b.ToTable("groups");
        b.HasKey(x => x.Id);
        b.Property(x => x.LeadShort).HasColumnName("lead_short");
        b.HasIndex(x => x.Active);
    }
}

public class GroupMemberConfiguration : IEntityTypeConfiguration<GroupMember>
{
    public void Configure(EntityTypeBuilder<GroupMember> b)
    {
        b.ToTable("group_members");
        b.HasKey(x => new { x.UserId, x.GroupId });
        b.Property(x => x.IsLead).HasColumnName("is_lead");
        b.Property(x => x.JoinedAt).HasColumnName("joined_at");
    }
}

public class ProductionOrderConfiguration : IEntityTypeConfiguration<ProductionOrder>
{
    public void Configure(EntityTypeBuilder<ProductionOrder> b)
    {
        b.ToTable("production_orders");
        b.HasKey(x => x.Id);
        b.Property(x => x.OrderNo).HasColumnName("order_no").IsRequired();
        b.HasIndex(x => x.OrderNo).IsUnique();
        b.Property(x => x.ProductLine).HasColumnName("product_line");
        b.Property(x => x.TargetQty).HasColumnName("target_qty");
        b.Property(x => x.PendingApproval).HasColumnName("pending_approval");
        b.Property(x => x.RowVersion).AsConcurrencyToken();
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.CreatedAt);
        b.HasIndex(x => new { x.Status, x.CreatedAt });
    }
}

public class OrderBomConfiguration : IEntityTypeConfiguration<OrderBom>
{
    public void Configure(EntityTypeBuilder<OrderBom> b)
    {
        b.ToTable("boms");
        b.HasKey(x => x.Id);
        b.Property(x => x.ProductionOrderId).HasColumnName("production_order_id");
        b.Property(x => x.BomCode).HasColumnName("bom_code");
        b.Property(x => x.PartName).HasColumnName("part_name");
        b.Property(x => x.CatalogBomId).HasColumnName("catalog_bom_id");
        b.Property(x => x.CatalogProcessId).HasColumnName("catalog_process_id");
        b.Property(x => x.AssignedWorkersJson).HasColumnName("assigned_workers").AsJsonColumn();
        b.Property(x => x.MaterialSpecsJson).HasColumnName("material_specs").AsJsonColumn();
        b.Property(x => x.SpecColsJson).HasColumnName("spec_cols");
        b.Property(x => x.RowVersion).AsConcurrencyToken();
        b.HasIndex(x => x.ProductionOrderId);
        b.HasIndex(x => new { x.ProductionOrderId, x.BomCode }).IsUnique();
        b.HasIndex(x => x.Status);
    }
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.ToTable("products");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.HasIndex(x => x.Name);
        b.HasIndex(x => x.Active);
        b.Property(x => x.RowVersion).AsConcurrencyToken();
    }
}

public class SemiProductConfiguration : IEntityTypeConfiguration<SemiProduct>
{
    public void Configure(EntityTypeBuilder<SemiProduct> b)
    {
        b.ToTable("semi_products");
        b.HasKey(x => x.Id);
        b.Property(x => x.ProductId).HasColumnName("product_id");
        b.Property(x => x.MeasurementSpecsJson).HasColumnName("measurement_specs").AsJsonColumn();
        b.HasIndex(x => x.ProductId);
        b.HasIndex(x => x.Code);
        b.HasIndex(x => x.Name);
    }
}

public class ShiftCloseConfiguration : IEntityTypeConfiguration<ShiftClose>
{
    public void Configure(EntityTypeBuilder<ShiftClose> b)
    {
        b.ToTable("shift_closes");
        b.HasKey(x => x.Id);
        b.Property(x => x.OrderId).HasColumnName("order_id");
        b.Property(x => x.BomId).HasColumnName("bom_id");
        b.Property(x => x.WorkerId).HasColumnName("worker_id");
        b.Property(x => x.HistoryJson).HasColumnName("history").AsJsonColumn();
        b.Property(x => x.RowVersion).AsConcurrencyToken();
        b.HasIndex(x => x.OrderId);
        b.HasIndex(x => x.BomId);
        b.HasIndex(x => x.WorkerId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => new { x.OrderId, x.BomId, x.WorkerId });
    }
}

public class AuthSessionConfiguration : IEntityTypeConfiguration<AuthSession>
{
    public void Configure(EntityTypeBuilder<AuthSession> b)
    {
        b.ToTable("auth_sessions");
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).HasColumnName("user_id");
        b.Property(x => x.RefreshTokenHash).HasColumnName("refresh_token_hash");
        b.HasIndex(x => x.UserId);
        b.HasIndex(x => x.RefreshTokenHash);
        b.HasIndex(x => x.ExpiresAt);
    }
}

public class WarehouseStockConfiguration : IEntityTypeConfiguration<WarehouseStock>
{
    public void Configure(EntityTypeBuilder<WarehouseStock> b)
    {
        b.ToTable("warehouse_stocks");
        b.HasKey(x => x.Id);
        b.Property(x => x.ItemKind).HasColumnName("item_kind").HasConversion<string>();
        b.Property(x => x.ItemId).HasColumnName("item_id");
        b.Property(x => x.RowVersion).AsConcurrencyToken();
        b.HasIndex(x => new { x.WarehouseId, x.ItemKind, x.ItemId }).IsUnique();
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).HasColumnName("user_id");
        b.HasIndex(x => new { x.UserId, x.Read, x.CreatedAt });
    }
}

// Remaining entities — default table names
public class PartBomConfiguration : IEntityTypeConfiguration<PartBom>
{
    public void Configure(EntityTypeBuilder<PartBom> b)
    {
        b.ToTable("part_boms");
        b.HasKey(x => x.Id);
        b.Property(x => x.SemiProductId).HasColumnName("semi_product_id");
        b.HasIndex(x => x.SemiProductId);
    }
}

public class BomProcessConfiguration : IEntityTypeConfiguration<BomProcess>
{
    public void Configure(EntityTypeBuilder<BomProcess> b)
    {
        b.ToTable("bom_processes");
        b.HasKey(x => x.Id);
        b.Property(x => x.BomId).HasColumnName("bom_id");
        b.Property(x => x.SortOrder).HasColumnName("sort_order");
        b.HasIndex(x => new { x.BomId, x.SortOrder });
    }
}

public class MachineConfiguration : IEntityTypeConfiguration<Machine>
{
    public void Configure(EntityTypeBuilder<Machine> b)
    {
        b.ToTable("machines");
        b.HasKey(x => x.Id);
        b.Property(x => x.AccountingCode).HasColumnName("accounting_code");
        b.HasIndex(x => x.Name);
        b.HasIndex(x => x.Active);
    }
}

public class MachineGroupConfiguration : IEntityTypeConfiguration<MachineGroup>
{
    public void Configure(EntityTypeBuilder<MachineGroup> b)
    {
        b.ToTable("machine_groups");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Code).IsUnique();
    }
}
