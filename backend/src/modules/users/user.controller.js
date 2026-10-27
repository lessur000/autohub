/**
 * =========================================================
 *  USERS CONTROLLER
 * =========================================================
 */

import * as usersService from "./users.service.js";
import { asyncHandler, sendSuccess } from "../../shared/moduleHelpers.js";

/**
 * =========================================================
 *  GET CURRENT USER
 * =========================================================
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await usersService.getMe(req.user.id);

  return sendSuccess(res, user, "User profile retrieved.");
});

/**
 * =========================================================
 *  UPDATE CURRENT USER
 * =========================================================
 */
export const updateMe = asyncHandler(async (req, res) => {
  const user = await usersService.updateMe(req.user.id, req.body);

  return sendSuccess(res, user, "Profile updated successfully.");
});

/**
 * =========================================================
 *  LIST USERS
 * =========================================================
 */
export const listUsers = asyncHandler(async (req, res) => {
  const result = await usersService.listUsers(req.query);

  return sendSuccess(res, result, "Users retrieved.");
});

/**
 * =========================================================
 *  UPDATE USER ACTIVE STATUS
 * =========================================================
 */
export const setUserActive = asyncHandler(async (req, res) => {
  const user = await usersService.setUserActive(
    req.params.id,
    req.body.isActive,
  );

  return sendSuccess(res, user, "User status updated.");
});
