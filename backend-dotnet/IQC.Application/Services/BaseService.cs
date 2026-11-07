using IQC.Application.Interfaces;
using IQC.Domain.Common;
using IQC.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace IQC.Application.Services;

public abstract class BaseService<TEntity> where TEntity : BaseEntity
{
    protected IRepository<TEntity> Repository { get; }
    protected IUnitOfWork UnitOfWork { get; }
    protected ICurrentUserService CurrentUser { get; }
    protected ILogger Logger { get; }

    protected BaseService(
        IRepository<TEntity> repository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        ILogger logger)
    {
        Repository = repository;
        UnitOfWork = unitOfWork;
        CurrentUser = currentUser;
        Logger = logger;
    }

    protected void ApplyCreateAudit(TEntity entity)
    {
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.CreatedById = CurrentUser.UserId;
        entity.CreatedByName = CurrentUser.UserName;
    }

    protected void ApplyUpdateAudit(TEntity entity)
    {
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedById = CurrentUser.UserId;
        entity.UpdatedByName = CurrentUser.UserName;
    }

    protected void LogAction(string action, object? data = null)
    {
        Logger.LogInformation(
            "{Action} by {UserId} ({UserName}) {@Data}",
            action,
            CurrentUser.UserId ?? "anonymous",
            CurrentUser.UserName ?? "anonymous",
            data);
    }
}
