import { Router } from "express";
import { authRoutes } from "./authRoutes.js";
import { catalogRoutes } from "./catalogRoutes.js";
import { complaintsRoutes } from "./complaintsRoutes.js";
import { incidentsRoutes } from "./incidentsRoutes.js";
import { notificationsRoutes } from "./notificationsRoutes.js";
import { ordersRoutes } from "./ordersRoutes.js";
import { overtimeRoutes } from "./overtimeRoutes.js";
import { payrollRoutes } from "./payrollRoutes.js";
import { specRoutes } from "./specRoutes.js";
import { statsRoutes } from "./statsRoutes.js";
import { usersRoutes } from "./usersRoutes.js";

export const apiRouter = Router();

apiRouter.use(authRoutes);
apiRouter.use(usersRoutes);
apiRouter.use(ordersRoutes);
apiRouter.use(incidentsRoutes);
apiRouter.use(overtimeRoutes);
apiRouter.use(complaintsRoutes);
apiRouter.use(statsRoutes);
apiRouter.use(notificationsRoutes);
apiRouter.use(payrollRoutes);
apiRouter.use(catalogRoutes);
apiRouter.use(specRoutes);
