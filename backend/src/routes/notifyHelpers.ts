import { SEED_USERS } from "../data/seed.js";
import { supabaseUserRepository } from "../repositories/SupabaseUserRepository.js";
import { workflowService } from "../services/WorkflowService.js";
import type { Notification, Role, User } from "../../../shared/src/types/index.js";

export type NotifyOpts = {
  refId?: string;
  type?: Notification["type"];
  refType?: string;
};

export async function usersByRole(role: Role) {
  try {
    const all = await supabaseUserRepository.findAll();
    if (all.length) return all.filter((u: User) => u.role === role && u.active);
  } catch {
    /* fallback */
  }
  return SEED_USERS.filter((u: User) => u.role === role && u.active);
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  opts?: NotifyOpts,
) {
  if (!userId) return;
  try {
    await workflowService.createNotification({
      userId,
      type: opts?.type ?? "order",
      refId: opts?.refId,
      refType: opts?.refType,
      title,
      body,
    });
  } catch {
    /* optional */
  }
}

/** 4th arg: refId string (legacy) hoặc NotifyOpts */
export async function notifyRoles(
  roles: Role[],
  title: string,
  body: string,
  refIdOrOpts?: string | NotifyOpts,
) {
  const opts: NotifyOpts =
    typeof refIdOrOpts === "string" ? { refId: refIdOrOpts } : refIdOrOpts ?? {};
  const type = opts.type ?? "shift";
  const refType = opts.refType ?? (type === "shift" ? "shift_close" : undefined);
  for (const role of roles) {
    const users = await usersByRole(role);
    for (const u of users) {
      await notifyUser(u.id, title, body, { ...opts, type, refType });
    }
  }
}
