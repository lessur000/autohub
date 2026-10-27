import * as adminService from "./admin.service.js";
import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await adminService.getDashboardSummary();

  return sendSuccess(res, summary, "Admin dashboard summary retrieved.");
});

export const getRecentOrders = asyncHandler(async (req, res) => {
  const orders = await adminService.getRecentOrders(req.query);

  return sendSuccess(res, orders, "Recent orders retrieved.");
});
