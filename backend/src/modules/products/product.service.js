/**
 * =========================================================
 *  PRODUCTS SERVICE
 * =========================================================
 */

import * as productsRepository from "../products/product.repository.js";

import {
  httpError,
  isUuid,
  makeSlug,
  parsePagination,
} from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  MAP PRODUCT RESPONSE
 * =========================================================
 */
const mapProduct = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    currency: row.currency.trim(),
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    categories: row.categories ?? [],
    images: row.images ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * =========================================================
 *  GET ALL PRODUCTS
 * =========================================================
 */
export const getProducts = async (query, canSeeInactive = false) => {
  const pagination = parsePagination(query);

  const search =
    typeof query.search === "string" ? query.search.trim().slice(0, 120) : "";

  const categoryId = query.categoryId || null;

  if (categoryId && !isUuid(categoryId)) {
    throw httpError(400, "Invalid category UUID.");
  }

  const includeInactive = canSeeInactive && query.includeInactive === "true";

  const filters = {
    ...pagination,
    search,
    categoryId,
    includeInactive,
  };

  const [products, total] = await Promise.all([
    productsRepository.findProducts(filters),
    productsRepository.countProducts(filters),
  ]);

  return {
    items: products.map(mapProduct),

    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

/**
 * =========================================================
 *  GET PRODUCT BY ID
 * =========================================================
 */
export const getProductById = async (id, canSeeInactive = false) => {
  if (!isUuid(id)) {
    throw httpError(400, "Invalid product UUID.");
  }

  const product = await productsRepository.findProductById(id, {
    includeInactive: canSeeInactive,
  });

  if (!product) {
    throw httpError(404, "Product not found.");
  }

  return mapProduct(product);
};

/**
 * =========================================================
 *  CREATE PRODUCT
 * =========================================================
 */
export const createProduct = async (input) => {
  const name = input.name.trim();
  const sku = input.sku.trim();
  const slug = makeSlug(input.slug || name);

  if (!slug) {
    throw httpError(400, "A valid product slug is required.");
  }

  const categoryIds = [...new Set(input.categoryIds ?? [])];

  try {
    const productId = await productsRepository.withTransaction(
      async (client) => {
        const categories = await productsRepository.findActiveCategories(
          categoryIds,
          client,
        );

        if (categories.length !== categoryIds.length) {
          throw httpError(
            400,
            "One or more categories do not exist or are inactive.",
          );
        }

        const id = await productsRepository.insertProduct(
          {
            ...input,
            sku,
            name,
            slug,
          },
          client,
        );

        await productsRepository.replaceProductCategories(
          id,
          categoryIds,
          client,
        );

        return id;
      },
    );

    return await getProductById(productId, true);
  } catch (error) {
    if (error.code === "23505") {
      throw httpError(409, "Product SKU or slug already exists.");
    }

    throw error;
  }
};

/**
 * =========================================================
 *  UPDATE PRODUCT
 * =========================================================
 */
export const updateProduct = async (id, input) => {
  if (!isUuid(id)) {
    throw httpError(400, "Invalid product UUID.");
  }

  const payload = { ...input };

  if (payload.sku !== undefined) {
    payload.sku = payload.sku.trim();
  }

  if (payload.name !== undefined) {
    payload.name = payload.name.trim();
  }

  if (payload.slug !== undefined || payload.name !== undefined) {
    payload.slug = makeSlug(payload.slug || payload.name);
  }

  if (payload.slug !== undefined && !payload.slug) {
    throw httpError(400, "A valid product slug is required.");
  }

  const categoryIds =
    payload.categoryIds === undefined
      ? undefined
      : [...new Set(payload.categoryIds)];

  try {
    await productsRepository.withTransaction(async (client) => {
      if (categoryIds !== undefined) {
        const categories = await productsRepository.findActiveCategories(
          categoryIds,
          client,
        );

        if (categories.length !== categoryIds.length) {
          throw httpError(
            400,
            "One or more categories do not exist or are inactive.",
          );
        }
      }

      const updatedId = await productsRepository.updateProduct(
        id,
        payload,
        client,
      );

      if (!updatedId) {
        throw httpError(404, "Product not found.");
      }

      if (categoryIds !== undefined) {
        await productsRepository.replaceProductCategories(
          id,
          categoryIds,
          client,
        );
      }
    });

    return await getProductById(id, true);
  } catch (error) {
    if (error.code === "23505") {
      throw httpError(409, "Product SKU or slug already exists.");
    }

    throw error;
  }
};

/**
 * =========================================================
 *  UPDATE PRODUCT ACTIVE STATUS
 * =========================================================
 */
export const setProductActive = async (id, isActive) => {
  if (!isUuid(id)) {
    throw httpError(400, "Invalid product UUID.");
  }

  if (typeof isActive !== "boolean") {
    throw httpError(400, "isActive must be a boolean.");
  }

  const updatedId = await productsRepository.updateProductActiveStatus(
    id,
    isActive,
  );

  if (!updatedId) {
    throw httpError(404, "Product not found.");
  }

  return getProductById(id, true);
};
