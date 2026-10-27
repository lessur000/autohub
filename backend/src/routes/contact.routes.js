import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import * as contactController from "../modules/contact/contact.controller.js";

const router = Router();

// Public contact form.
// If the user is authenticated, attach the optional user identity
// using a separate optional-auth middleware if your project has one.
router.post("/", contactController.submitContactMessage);

// Admin/staff endpoints.
router.get(
  "/admin",
  authenticate,
  authorize("admin", "staff"),
  contactController.getContactMessages,
);

router.patch(
  "/admin/:messageId/status",
  authenticate,
  authorize("admin", "staff"),
  contactController.changeContactStatus,
);

export default router;
