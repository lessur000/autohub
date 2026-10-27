import { Router } from "express";

import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import orderRoutes from "./order.routes.js";
import paymentRoutes from "./payment.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import refundRoutes from "./refund.routes.js";
import webhookRoutes from "./webhook.routes.js";
import cartRoutes from "./cart.routes.js";
import adminRoutes from "./admin.routes.js";
import contactRoutes from "./contact.routes.js";
import returnRoutes from "./returns.routes.js";
import reviewRoutes from "./review.routes.js";
import shippingRoutes from "./shipping.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import cloudinaryRoutes from "./cloudinary.routes.js";


const router = Router();

/**
 * =========================================================
 *  AUTHENTICATION & CUSTOMER
 * =========================================================
 */
router.use("/auth", authRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/shipping", shippingRoutes);
router.use("/contact", contactRoutes);
router.use("/reviews", reviewRoutes);

/**
 * =========================================================
 *  PRODUCTS, ORDERS & PAYMENTS
 * =========================================================
 */
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/refunds", refundRoutes);

/**
 * =========================================================
 *  ADMIN & INVENTORY
 * =========================================================
 */
router.use("/admin", adminRoutes);
router.use("/inventory", inventoryRoutes);

/**
 * =========================================================
 *  WEBHOOKS
 * =========================================================
 */
router.use("/webhooks", webhookRoutes);


/**
 * =========================================================
 *  CLOUDINARY INTEGRATION
 * =========================================================
 */
router.use("/cloudinary", cloudinaryRoutes);

export default router;
