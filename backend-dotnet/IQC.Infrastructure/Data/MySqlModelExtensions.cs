using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IQC.Infrastructure.Data;

internal static class MySqlModelExtensions
{
    public static PropertyBuilder<T> AsJsonColumn<T>(this PropertyBuilder<T> property) =>
        property.HasColumnType("json");

    public static PropertyBuilder<uint> AsConcurrencyToken(this PropertyBuilder<uint> property) =>
        property.HasColumnName("row_version")
            .IsConcurrencyToken()
            .HasDefaultValue(0u);
}
