import {
  requestReturn,
  getMyReturns,
  getMyReturnById,
  getReturns,
  reviewReturn,
} from "./returns.service.js";
import { sendSuccess, asyncHandler } from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  CREATE RETURN REQUEST CONTROLLER
 * =========================================================
 */
export const createReturnRequestController = asyncHandler(async (req, res) => {
  const result = await requestReturn(req.user.id, req.body);

  return sendSuccess(
    res,
    201,
    "Return request submitted successfully.",
    result,
  );
});

/**
 * =========================================================
 *  GET MY RETURNS CONTROLLER
 * =========================================================
 */
export const getMyReturnsController = asyncHandler(async (req, res) => {
  const result = await getMyReturns(req.user.id);

  return sendSuccess(
    res,
    200,
    "Return requests retrieved successfully.",
    result,
  );
});

/**
 * =========================================================
 *  GET MY RETURN DETAILS CONTROLLER
 * =========================================================
 */
export const getMyReturnByIdController = asyncHandler(async (req, res) => {
  const result = await getMyReturnById(req.user.id, req.params.returnId);

  return sendSuccess(
    res,
    200,
    "Return request retrieved successfully.",
    result,
  );
});

/**
 * =========================================================
 *  GET ALL RETURNS CONTROLLER
 * =========================================================
 */
export const getReturnsController = asyncHandler(async (req, res) => {
  const result = await getReturns(req.query);

  return sendSuccess(
    res,
    200,
    "Return requests retrieved successfully.",
    result,
  );
});

/**
 * =========================================================
 *  REVIEW RETURN REQUEST CONTROLLER
 * =========================================================
 */
export const reviewReturnController = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;

  const result = await reviewReturn(
    req.params.returnId,
    req.user.id,
    status,
    reviewNote,
  );

  return sendSuccess(res, 200, "Return request reviewed successfully.", result);
});
