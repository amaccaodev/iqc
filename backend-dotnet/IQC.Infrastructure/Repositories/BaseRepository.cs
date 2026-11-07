using System.Linq.Expressions;
using IQC.Domain.Common;
using IQC.Domain.Interfaces;
using IQC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IQC.Infrastructure.Repositories;

public class BaseRepository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly IqcDbContext Context;
    protected readonly DbSet<T> DbSet;

    public BaseRepository(IqcDbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(string id, CancellationToken ct = default) =>
        await DbSet.FindAsync([id], ct);

    public virtual async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default) =>
        await DbSet.AsNoTracking().ToListAsync(ct);

    public virtual async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        await DbSet.AsNoTracking().Where(predicate).ToListAsync(ct);

    public virtual async Task<(IReadOnlyList<T> Items, int Total)> SearchPagedAsync(
        int page,
        int pageSize,
        Expression<Func<T, bool>>? filter = null,
        Expression<Func<T, object>>? orderBy = null,
        bool descending = false,
        CancellationToken ct = default)
    {
        var query = DbSet.AsNoTracking().AsQueryable();
        if (filter is not null) query = query.Where(filter);

        var total = await query.CountAsync(ct);

        if (orderBy is not null)
            query = descending ? query.OrderByDescending(orderBy) : query.OrderBy(orderBy);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await DbSet.AddAsync(entity, ct);
        return entity;
    }

    public virtual Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        DbSet.Update(entity);
        return Task.CompletedTask;
    }

    public virtual Task DeleteAsync(T entity, CancellationToken ct = default)
    {
        DbSet.Remove(entity);
        return Task.CompletedTask;
    }

    public virtual async Task<bool> ExistsAsync(string id, CancellationToken ct = default) =>
        await DbSet.AnyAsync(x => x.Id == id, ct);
}

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly IqcDbContext _context;

    public UnitOfWork(IqcDbContext context) => _context = context;

    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        _context.SaveChangesAsync(ct);

    public Task BeginTransactionAsync(CancellationToken ct = default) =>
        _context.BeginTransactionAsync(ct);

    public Task CommitTransactionAsync(CancellationToken ct = default) =>
        _context.CommitTransactionAsync(ct);

    public Task RollbackTransactionAsync(CancellationToken ct = default) =>
        _context.RollbackTransactionAsync(ct);

    public ValueTask DisposeAsync() => _context.DisposeAsync();
}
