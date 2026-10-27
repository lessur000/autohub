import { Router } from "express";

import * as authController from "../modules/auth/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Public authentication endpoints.
router.post("/register", authRateLimiter, authController.register);

router.post("/login", authRateLimiter, authController.login);

// Protected authentication endpoints.
router.get("/me", authenticate, authController.getMe);

export default router;
