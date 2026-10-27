import * as shippingService from "./shipping.service.js";
import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await shippingService.getAddresses(req.user.id);

  return sendSuccess(res, addresses, "Shipping addresses retrieved.");
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await shippingService.createAddress(req.user.id, req.body);

  return sendSuccess(res, address, "Shipping address created.", 201);
});

export const editAddress = asyncHandler(async (req, res) => {
  const address = await shippingService.editAddress(
    req.params.addressId,
    req.user.id,
    req.body,
  );

  return sendSuccess(res, address, "Shipping address updated.");
});

export const removeAddress = asyncHandler(async (req, res) => {
  await shippingService.removeAddress(req.params.addressId, req.user.id);

  return sendSuccess(res, null, "Shipping address deleted.");
});

export const makeDefaultAddress = asyncHandler(async (req, res) => {
  const address = await shippingService.makeDefaultAddress(
    req.params.addressId,
    req.user.id,
  );

  return sendSuccess(res, address, "Default shipping address updated.");
});
