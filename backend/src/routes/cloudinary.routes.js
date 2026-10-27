import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import {
  uploadMultipleImages,
  uploadSingleImage,
} from "../middleware/upload.middleware.js";
import {
  validateDeleteImage,
  validateMultipleUpload,
  validateProductId,
  validateUpload,
} from "../integrations/cloudinary/cloudinary.validation.js";
import {
  deleteImageController,
  uploadMultipleImagesController,
  uploadSingleImageController,
  uploadProductImageController,
  deleteProductImageController,
  getProductImagesController,
} from "../integrations/cloudinary/cloudinary.controller.js";

const router = Router();

// Single image upload
router.post(
  "/upload",
  authenticate,
  authorize("admin"),
  uploadSingleImage,
  validateUpload,
  uploadSingleImageController,
);

router.get(
  "/products/:productId/images",
  authenticate,
  authorize("admin"),
  validateProductId,
  getProductImagesController,
);

// Multiple image upload
router.post(
  "/upload/multiple",
  authenticate,
  authorize("admin"),
  uploadMultipleImages,
  validateMultipleUpload,
  uploadMultipleImagesController,
);

router.delete(
  "/image",
  authenticate,
  authorize("admin"),
  validateDeleteImage,
  deleteImageController,
);

// Upload product image
router.post(
  "/products/:productId/images",
  authenticate,
  authorize("admin"),
  uploadSingleImage,
  validateUpload,
  uploadProductImageController,
);

router.delete(
  "/products/images/:imageId",
  authenticate,
  authorize("admin"),
  deleteProductImageController,
);

export default router;
