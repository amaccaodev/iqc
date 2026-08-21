import { Router } from "express";
import {
  parseListQueryFromRequest,
  wantsPagedListQuery,
} from "../../../shared/src/utils/listQuery.js";
import { workflowService } from "../services/WorkflowService.js";

export const overtimeRoutes = Router();

overtimeRoutes.get("/overtime", async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    if (wantsPagedListQuery(q, ["status", "orderId"])) {
      const data = await workflowService.listOvertimePaged(parseListQueryFromRequest(q));
      return res.json({ success: true, data });
    }
    const data = await workflowService.getOvertimeRequests({
      orderId: q.orderId,
      status: q.status,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

overtimeRoutes.post("/overtime", async (req, res) => {
  try {
    const data = await workflowService.createOvertimeRequest(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

overtimeRoutes.post("/overtime/:id/review", async (req, res) => {
  try {
    const { approved, supervisorId, supervisorNote } = req.body as {
      approved: boolean; supervisorId: string; supervisorNote: string;
    };
    const data = await workflowService.reviewOvertimeBySupervisor(req.params.id, approved, supervisorId, supervisorNote);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

overtimeRoutes.post("/overtime/:id/complete", async (req, res) => {
  try {
    const data = await workflowService.completeOvertime(req.params.id, req.body.actualHours);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
