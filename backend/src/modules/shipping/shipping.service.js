import * as shippingRepository from "./shipping.repository.js";
import { httpError, isUuid } from "../../shared/utils/moduleHelpers.js";

const validateAddress = (data) => {
  const required = [
    "recipientName",
    "phone",
    "addressLine1",
    "city",
    "province",
  ];

  for (const field of required) {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      throw httpError(400, `${field} is required.`);
    }
  }

  if (data.countryCode && !/^[A-Za-z]{2}$/.test(data.countryCode)) {
    throw httpError(400, "countryCode must contain two letters.");
  }
};

export const getAddresses = async (userId) => {
  return shippingRepository.findAddresses(userId);
};

export const createAddress = async (userId, payload) => {
  validateAddress(payload);

  return shippingRepository.withTransaction(async (db) => {
    if (payload.isDefault) {
      await shippingRepository.clearDefaultAddresses(userId, db);
    }

    return shippingRepository.insertAddress(userId, payload, db);
  });
};

export const editAddress = async (addressId, userId, payload) => {
  if (!isUuid(addressId)) {
    throw httpError(400, "Invalid address ID.");
  }

  validateAddress(payload);

  const address = await shippingRepository.updateAddress(
    addressId,
    userId,
    payload,
  );

  if (!address) {
    throw httpError(404, "Shipping address not found.");
  }

  return address;
};

export const removeAddress = async (addressId, userId) => {
  if (!isUuid(addressId)) {
    throw httpError(400, "Invalid address ID.");
  }

  const deleted = await shippingRepository.deleteAddress(addressId, userId);

  if (!deleted) {
    throw httpError(404, "Shipping address not found.");
  }
};

export const makeDefaultAddress = async (addressId, userId) => {
  if (!isUuid(addressId)) {
    throw httpError(400, "Invalid address ID.");
  }

  return shippingRepository.withTransaction(async (db) => {
    const existing = await shippingRepository.findAddressById(
      addressId,
      userId,
      db,
    );

    if (!existing) {
      throw httpError(404, "Shipping address not found.");
    }

    await shippingRepository.clearDefaultAddresses(userId, db);

    return shippingRepository.setDefaultAddress(addressId, userId, db);
  });
};
