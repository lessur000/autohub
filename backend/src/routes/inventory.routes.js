// import { Router } from "express";
// import * as inventoryController from "../modules/inventory/inventory.controller.js";
// import { authenticate } from "../middleware/authenticate.js";
// import { authorize } from "../middleware/authorize.js";

// const router = Router();

// router.use(authenticate);
// router.use(authorize("admin"));

// // Inventory overview.
// router.get("/", inventoryController.getInventory);

// // Inventory movement history.
// router.get("/movements", inventoryController.getInventoryMovements);

// // Adjust inventory.
// router.post("/movements", inventoryController.createInventoryMovement);

// // Update inventory record.
// router.patch("/:id", inventoryController.updateInventory);

// export default router;

import { Router } from "express";

import * as inventoryController from "../modules/inventory/inventory.controller.js";

import { authenticate } from "../middleware/authenticate.js";
import { validateStockAdjustment } from "../modules/inventory/inventory.validation.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.use(authenticate, authorize("admin", "staff"));

router.get("/", inventoryController.getInventory);
router.get("/movements", inventoryController.getInventoryMovements);
router.post(
  "/adjustments",
  validateStockAdjustment,
  inventoryController.changeStock,
);

export default router;
