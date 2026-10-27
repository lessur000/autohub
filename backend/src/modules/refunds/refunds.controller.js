import * as refundService from "./refunds.service.js";
import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";

export const requestRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.requestRefund(req.user.id, req.body);

  return sendSuccess(res, refund, "Refund request submitted.", 201);
});

export const getRefunds = asyncHandler(async (req, res) => {
  const result = await refundService.getRefunds(req.user, req.query);

  return sendSuccess(res, result, "Refunds retrieved successfully.");
});

export const approveRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.approveRefund(
    req.params.refundId,
    req.user.id,
  );

  return sendSuccess(res, refund, "Refund submitted for processing.");
});

export const rejectRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.rejectRefund(
    req.params.refundId,
    req.user.id,
    req.body.reason,
  );

  return sendSuccess(res, refund, "Refund request rejected.");
});
