import { Router } from "express";
import * as webhookController from "../modules/webhooks/webhooks.controller.js";

const router = Router();

router.post("/xendit", webhookController.xenditWebhook);

export default router;
