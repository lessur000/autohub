import { Router } from "express";

import * as authController from "../modules/auth/auth.controller.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "../modules/auth/auth.validation.js";

import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authenticate.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  authController.register,
);

router.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login,
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  authRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword,
);

router.post(
  "/verify-email",
  authRateLimiter,
  validateRequest({ body: verifyEmailSchema }),
  authController.verifyEmail,
);

router.post(
  "/resend-verification",
  authRateLimiter,
  validateRequest({ body: resendVerificationSchema }),
  authController.resendVerificationEmail,
);

router.get("/me", authenticate, authController.getMe);

export default router;
