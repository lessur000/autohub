/**
 * =========================================================
 *  USERS SERVICE
 * =========================================================
 */

import * as usersRepository from "./users.repository.js";
import {
  httpError,
  parsePagination,
  publicUser,
} from "../../shared/moduleHelpers.js";

/**
 * =========================================================
 *  GET CURRENT USER
 * =========================================================
 */
export const getMe = async (userId) => {
  const user = await usersRepository.findUserById(userId);

  if (!user) {
    throw httpError(404, "User not found.");
  }

  return publicUser(user);
}

/**
 * =========================================================
 *  UPDATE CURRENT USER PROFILE
 * =========================================================
 */
export const updateMe = async (userId, input) => {
  const fullName =
    input.fullName === undefined ? undefined : input.fullName.trim();

  const phone =
    input.phone === undefined
      ? undefined
      : input.phone === null
        ? null
        : input.phone.trim();

  const user = await usersRepository.updateUserProfile(userId, {
    fullName,
    phone,
  });

  if (!user) {
    throw httpError(404, "User not found.");
  }

  return publicUser(user);
}

/**
 * =========================================================
 *  LIST USERS
 * =========================================================
 */
export const listUsers = async (query) => {
  const pagination = parsePagination(query);

  const [users, total] = await Promise.all([
    usersRepository.findUsers(pagination),
    usersRepository.countUsers(),
  ]);

  return {
    items: users.map(publicUser),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

/**
 * =========================================================
 *  UPDATE USER ACTIVE STATUS
 * =========================================================
 */
export const setUserActive = async (id, isActive) => {
  if (typeof isActive !== "boolean") {
    throw httpError(400, "isActive must be a boolean.");
  }

  const user = await usersRepository.updateUserActiveStatus(id, isActive);

  if (!user) {
    throw httpError(404, "User not found.");
  }

  return publicUser(user);
}
