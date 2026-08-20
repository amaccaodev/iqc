/**
 * SupabaseUserRepository
 * Reads users with their roles and group memberships using the normalized schema:
 *   users → user_roles → roles
 *   users → group_members → groups
 *
 * Maps to the shared User type for backward compatibility with services.
 */
import type { Role, User } from "../../../shared/src/types/index.js";
import { supabase } from "../lib/supabase.js";

interface DbUser {
  id: string;
  employee_id: string;
  name: string;
  password: string;
  department: string;
  phone: string;
  active: boolean;
}

interface DbUserWithRelations extends DbUser {
  user_roles: { role_id: string }[];
  group_members: { group_id: string; is_lead: boolean }[];
}

function mapUser(row: DbUserWithRelations): User {
  const primaryRole = (row.user_roles[0]?.role_id ?? "worker") as Role;
  const primaryGroupId = row.group_members[0]?.group_id ?? "";
  return {
    id: row.id,
    employeeId: row.employee_id,
    name: row.name,
    password: row.password,
    role: primaryRole,
    teamId: primaryGroupId,
    department: row.department,
    phone: row.phone,
    active: row.active,
  };
}

export class SupabaseUserRepository {
  async findAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*, user_roles(role_id), group_members(group_id, is_lead)")
      .eq("active", true)
      .returns<DbUserWithRelations[]>();
    if (error || !data) return [];
    return data.map(mapUser);
  }

  async findByEmployeeId(employeeId: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*, user_roles(role_id), group_members(group_id, is_lead)")
      .eq("employee_id", employeeId)
      .single<DbUserWithRelations>();
    if (error || !data) return undefined;
    return mapUser(data);
  }

  async findById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*, user_roles(role_id), group_members(group_id, is_lead)")
      .eq("id", id)
      .single<DbUserWithRelations>();
    if (error || !data) return undefined;
    return mapUser(data);
  }

  /** Gán role cho user */
  async addRole(userId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role_id: roleId }, { onConflict: "user_id,role_id" });
    if (error) throw new Error(error.message);
  }

  /** Xóa role của user */
  async removeRole(userId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", roleId);
    if (error) throw new Error(error.message);
  }

  /** Thêm user vào group */
  async addToGroup(userId: string, groupId: string, isLead = false): Promise<void> {
    const { error } = await supabase
      .from("group_members")
      .upsert({ user_id: userId, group_id: groupId, is_lead: isLead }, { onConflict: "user_id,group_id" });
    if (error) throw new Error(error.message);
  }

  /** Xóa user khỏi group */
  async removeFromGroup(userId: string, groupId: string): Promise<void> {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("user_id", userId)
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
  }
}

export const supabaseUserRepository = new SupabaseUserRepository();
