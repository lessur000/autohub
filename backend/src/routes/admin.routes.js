import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import * as adminController from "../modules/admin/admin.controller.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/dashboard", adminController.getDashboardSummary);
router.get("/recent-orders", adminController.getRecentOrders);

export default router;
