import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as wishlistController from "../modules/wishlist/wishlist.controller.js";
import { isUuid, httpError } from "../shared/utils/moduleHelpers.js";

const router = Router();

const validateProductId = (req, res, next) => {
  if (!isUuid(req.params.productId)) {
    return next(httpError(400, "Invalid product ID."));
  }

  next();
};

router.use(authenticate);

router.get("/", wishlistController.getWishlist);
router.post("/", wishlistController.addToWishlist);
router.delete("/", wishlistController.clearWishlist);
router.delete(
  "/:productId",
  validateProductId,
  wishlistController.removeFromWishlist,
);

export default router;
