import { Router } from "express";
import {
  parseListQueryFromRequest,
  wantsPagedListQuery,
} from "../../../shared/src/utils/listQuery.js";
import { workflowService } from "../services/WorkflowService.js";

export const notificationsRoutes = Router();

notificationsRoutes.get("/notifications/:userId", async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    if (wantsPagedListQuery(q, ["unreadOnly"])) {
      const parsed = parseListQueryFromRequest(q);
      const data = await workflowService.listNotificationsPaged(req.params.userId, parsed);
      return res.json({ success: true, data });
    }
    const unreadOnly = q.unread === "true";
    const data = await workflowService.getNotifications(req.params.userId, unreadOnly);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

notificationsRoutes.post("/notifications", async (req, res) => {
  try {
    await workflowService.createNotification(req.body);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

notificationsRoutes.patch("/notifications/:id/read", async (req, res) => {
  try {
    await workflowService.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

notificationsRoutes.post("/notifications/:userId/read-all", async (req, res) => {
  try {
    await workflowService.markAllNotificationsRead(req.params.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
