import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as shippingController from "../modules/shipping/shipping.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", shippingController.getAddresses);
router.post("/", shippingController.createAddress);
router.patch("/:addressId", shippingController.editAddress);
router.delete("/:addressId", shippingController.removeAddress);
router.patch("/:addressId/default", shippingController.makeDefaultAddress);

export default router;
