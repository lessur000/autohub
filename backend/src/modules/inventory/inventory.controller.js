import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";
import * as inventoryService from "./inventory.service.js";

export const getInventory = asyncHandler(async (req, res) => {
  const result = await inventoryService.getInventory(req.query);
  return sendSuccess(res, result, "Inventory retrieved successfully.");
});

export const getInventoryMovements = asyncHandler(async (req, res) => {
  const result = await inventoryService.getInventoryMovements(req.query);
  return sendSuccess(
    res,
    result,
    "Inventory movements retrieved successfully.",
  );
});

export const changeStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.changeStock(req.body, req.user.id);
  return sendSuccess(res, result, "Inventory updated successfully.");
});
