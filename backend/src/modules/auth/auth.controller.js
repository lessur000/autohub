import * as authService from "./auth.service.js";
import { apiResponse } from "../../shared/utils/ApiResponse.js";

/**
 * =========================================================
 *  REGISTER USER CONTROLLER
 * =========================================================
 */
export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    return apiResponse(res, {
      statusCode: 201,
      message: "Account registered successfully.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * =========================================================
 *  LOGIN USER CONTROLLER
 * =========================================================
 */
export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    return apiResponse(res, {
      statusCode: 200,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * =========================================================
 *  GET CURRENT USER CONTROLLER
 * =========================================================
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    return apiResponse(res, {
      statusCode: 200,
      message: "User retrieved successfully.",
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
};
