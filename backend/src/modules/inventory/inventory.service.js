import * as inventoryRepository from "./inventory.repository.js";
import {
  httpError,
  isUuid,
  parsePagination,
} from "../../shared/utils/moduleHelpers.js";

export const getInventory = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  const items = await inventoryRepository.findInventory({
    search: typeof query.search === "string" ? query.search.trim() : null,
    limit,
    offset,
  });

  return { page, limit, items };
};

export const getInventoryMovements = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);
  const productId = query.productId || null;

  if (productId && !isUuid(productId)) {
    throw httpError(400, "Invalid product ID.");
  }

  const movements = await inventoryRepository.findInventoryMovements({
    productId,
    limit,
    offset,
  });

  return { page, limit, movements };
};

export const changeStock = async (payload, actorUserId) => {
  const { productId, movementType, quantityDelta, note } = payload;

  if (!isUuid(productId)) {
    throw httpError(400, "A valid productId is required.");
  }

  const validTypes = ["restock", "adjustment"];

  if (!validTypes.includes(movementType)) {
    throw httpError(
      400,
      "Manual inventory changes must use restock or adjustment.",
    );
  }

  if (!Number.isSafeInteger(quantityDelta) || quantityDelta === 0) {
    throw httpError(400, "quantityDelta must be a non-zero integer.");
  }

  if (movementType === "restock" && quantityDelta < 1) {
    throw httpError(400, "Restock quantity must be positive.");
  }

  return inventoryRepository.withTransaction((db) =>
    inventoryRepository.adjustStock(
      { productId, movementType, quantityDelta, note, actorUserId },
      db,
    ),
  );
};
