import { Router } from "express";
import {
  parseListQueryFromRequest,
  wantsPagedListQuery,
} from "../../../shared/src/utils/listQuery.js";
import { workflowService } from "../services/WorkflowService.js";

export const incidentsRoutes = Router();

incidentsRoutes.get("/incidents/stats", async (_req, res) => {
  try {
    const data = await workflowService.getIncidentStatusCounts();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

incidentsRoutes.get("/incidents", async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    if (wantsPagedListQuery(q, ["status", "orderId", "bomId"])) {
      const data = await workflowService.listIncidentsPaged(parseListQueryFromRequest(q));
      return res.json({ success: true, data });
    }
    const data = await workflowService.getIncidents({
      orderId: q.orderId,
      bomId: q.bomId,
      status: q.status,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

incidentsRoutes.get("/incidents/:id", async (req, res) => {
  try {
    const data = await workflowService.getIncidentById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: "Không tìm thấy sự cố" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

incidentsRoutes.post("/incidents", async (req, res) => {
  try {
    const data = await workflowService.createIncident(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

incidentsRoutes.post("/incidents/:id/assign", async (req, res) => {
  try {
    const { assignedTo, assignedName } = req.body as { assignedTo: string; assignedName: string };
    const data = await workflowService.assignIncident(req.params.id, assignedTo, assignedName);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

incidentsRoutes.post("/incidents/:id/resolve", async (req, res) => {
  try {
    const { resolvedBy, resolvedName, resolutionNote, downtimeMinutes } = req.body as {
      resolvedBy: string; resolvedName: string; resolutionNote: string; downtimeMinutes: number;
    };
    const data = await workflowService.resolveIncident(req.params.id, resolvedBy, resolvedName, resolutionNote, downtimeMinutes);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

incidentsRoutes.post("/incidents/:id/confirm", async (req, res) => {
  try {
    const data = await workflowService.confirmIncident(req.params.id, req.body.confirmedBy);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
