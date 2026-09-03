import { Router } from "express";
import {
  parseListQueryFromRequest,
  wantsPagedListQuery,
} from "../../../shared/src/utils/listQuery.js";
import { workflowService } from "../services/WorkflowService.js";

export const statsRoutes = Router();

statsRoutes.get("/stats", async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    if (wantsPagedListQuery(q, ["orderId", "bomId", "statDate"])) {
      const data = await workflowService.listStatsPaged(parseListQueryFromRequest(q));
      return res.json({ success: true, data });
    }
    const data = await workflowService.getStats({
      orderId: req.query.orderId as string,
      bomId: req.query.bomId as string,
      statDate: req.query.statDate as string,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

statsRoutes.post("/stats", async (req, res) => {
  try {
    const data = await workflowService.upsertStat(req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

statsRoutes.get("/stats/summary/:orderId", async (req, res) => {
  try {
    const data = await workflowService.getOrderSummary(req.params.orderId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});
