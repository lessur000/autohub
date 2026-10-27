import { Router } from "express";
import * as productController from "../modules/products/product.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

// Public endpoints
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

// Admin endpoints
router.post(
  "/",
  authenticate,
  authorize("admin"),
  productController.createProduct,
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  productController.updateProduct,
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  productController.deleteProduct,
);

export default router;
