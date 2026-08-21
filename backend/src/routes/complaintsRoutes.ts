import { Router } from "express";
import {
  parseListQueryFromRequest,
  wantsPagedListQuery,
} from "../../../shared/src/utils/listQuery.js";
import { workflowService } from "../services/WorkflowService.js";

export const complaintsRoutes = Router();

complaintsRoutes.get("/complaints", async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    if (wantsPagedListQuery(q, ["status", "orderId", "bomId"])) {
      const data = await workflowService.listComplaintsPaged(parseListQueryFromRequest(q));
      return res.json({ success: true, data });
    }
    const data = await workflowService.getComplaints({
      orderId: q.orderId,
      bomId: q.bomId,
      status: q.status,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

complaintsRoutes.get("/complaints/:id", async (req, res) => {
  try {
    const data = await workflowService.getComplaintById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: "Không tìm thấy khiếu nại" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

complaintsRoutes.post("/complaints", async (req, res) => {
  try {
    const data = await workflowService.createComplaint(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

complaintsRoutes.post("/complaints/:id/acknowledge", async (req, res) => {
  try {
    const { acknowledgedBy, acknowledgedName } = req.body as { acknowledgedBy: string; acknowledgedName: string };
    const data = await workflowService.acknowledgeComplaint(req.params.id, acknowledgedBy, acknowledgedName);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

complaintsRoutes.post("/complaints/:id/respond", async (req, res) => {
  try {
    const data = await workflowService.respondToComplaint(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

complaintsRoutes.post("/complaints/:id/recheck", async (req, res) => {
  try {
    const { qcRecheckBy, qcRecheckName, result, note } = req.body as {
      qcRecheckBy: string; qcRecheckName: string; result: "passed" | "failed_again"; note: string;
    };
    const data = await workflowService.recheckComplaint(req.params.id, qcRecheckBy, qcRecheckName, result, note);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

complaintsRoutes.post("/complaints/:id/close", async (req, res) => {
  try {
    const data = await workflowService.closeComplaint(req.params.id, req.body.closedBy);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
