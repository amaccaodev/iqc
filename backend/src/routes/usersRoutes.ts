import { Router } from "express";
import { TEAMS } from "../../../shared/src/constants/teams.js";
import {
  parseListQueryFromRequest,
  wantsPagedListQuery,
} from "../../../shared/src/utils/listQuery.js";
import { supabase } from "../lib/supabase.js";
import { supabaseUserRepository } from "../repositories/SupabaseUserRepository.js";
import { userQueryService } from "../services/UserQueryService.js";

export const usersRoutes = Router();

usersRoutes.get("/users", async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    if (wantsPagedListQuery(q, ["roles"])) {
      const data = await userQueryService.listPaged(parseListQueryFromRequest(q));
      return res.json({ success: true, data });
    }
    const data = await userQueryService.listAllPublic();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.get("/teams", (_req, res) => {
  res.json({ success: true, data: TEAMS });
});

usersRoutes.get("/roles", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("roles").select("*").order("id");
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.post("/roles", async (req, res) => {
  try {
    const { id, label, description = "" } = req.body as { id: string; label: string; description?: string };
    const { data, error } = await supabase.from("roles").insert({ id, label, description }).select().single();
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.patch("/roles/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("roles").update(req.body).eq("id", req.params.id).select().single();
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.delete("/roles/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("roles").delete().eq("id", req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.get("/groups", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("groups").select("*, group_members(user_id, is_lead)").order("id");
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.post("/groups", async (req, res) => {
  try {
    const { id, name, lead = "", lead_short = "", description = "" } = req.body as {
      id: string; name: string; lead?: string; lead_short?: string; description?: string;
    };
    const { data, error } = await supabase.from("groups").insert({ id, name, lead, lead_short, description }).select().single();
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.patch("/groups/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("groups").update(req.body).eq("id", req.params.id).select().single();
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.delete("/groups/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("groups").delete().eq("id", req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.post("/users", async (req, res) => {
  try {
    const { employeeId, name, password, department = "", phone = "" } = req.body as {
      employeeId: string; name: string; password: string; department?: string; phone?: string;
    };
    const id = `u-${Date.now()}`;
    const { error } = await supabase.from("users").insert({ id, employee_id: employeeId, name, password, department, phone });
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data: { id, employeeId, name, department, phone, active: true } });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.patch("/users/:id", async (req, res) => {
  try {
    const patch: Record<string, unknown> = {};
    if (req.body.name) patch.name = req.body.name;
    if (req.body.department) patch.department = req.body.department;
    if (req.body.phone) patch.phone = req.body.phone;
    if (req.body.password) patch.password = req.body.password;
    if (req.body.active !== undefined) patch.active = req.body.active;
    const { error } = await supabase.from("users").update(patch).eq("id", req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.patch("/users/:id/toggle", async (req, res) => {
  try {
    const { data: cur } = await supabase.from("users").select("active").eq("id", req.params.id).single();
    const { error } = await supabase.from("users").update({ active: !(cur as { active: boolean }).active }).eq("id", req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.post("/users/:userId/roles", async (req, res) => {
  try {
    await supabaseUserRepository.addRole(req.params.userId, req.body.roleId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.delete("/users/:userId/roles/:roleId", async (req, res) => {
  try {
    await supabaseUserRepository.removeRole(req.params.userId, req.params.roleId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.post("/users/:userId/groups", async (req, res) => {
  try {
    await supabaseUserRepository.addToGroup(req.params.userId, req.body.groupId, req.body.isLead ?? false);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

usersRoutes.delete("/users/:userId/groups/:groupId", async (req, res) => {
  try {
    await supabaseUserRepository.removeFromGroup(req.params.userId, req.params.groupId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
