/**
 * =========================================================
 *  CATEGORIES SERVICE
 * =========================================================
 */

import * as categoriesRepository from "./category.repository.js";

import {
  httpError,
  isUuid,
  makeSlug,
  parsePagination,
} from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  MAP CATEGORY RESPONSE
 * =========================================================
 */
const mapCategory = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * =========================================================
 *  GET ALL CATEGORIES
 * =========================================================
 */
export const getCategories = async (query, canSeeInactive = false) => {
  const pagination = parsePagination(query);

  const includeInactive = canSeeInactive && query.includeInactive === "true";

  const [rows, total] = await Promise.all([
    categoriesRepository.findCategories({
      ...pagination,
      includeInactive,
    }),

    categoriesRepository.countCategories(includeInactive),
  ]);

  return {
    items: rows.map(mapCategory),

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
 *  GET CATEGORY BY ID
 * =========================================================
 */
export const getCategoryById = async (id) => {
  if (!isUuid(id)) {
    throw httpError(400, "Invalid category UUID.");
  }

  const category = await categoriesRepository.findCategoryById(id);

  if (!category || !category.is_active) {
    throw httpError(404, "Category not found.");
  }

  return mapCategory(category);
};

/**
 * =========================================================
 *  CREATE CATEGORY
 * =========================================================
 */
export const createCategory = async (input) => {
  const name = input.name.trim();
  const slug = makeSlug(input.slug || name);

  if (!slug) {
    throw httpError(400, "A valid category slug is required.");
  }

  try {
    const category = await categoriesRepository.createCategory({
      name,
      slug,
      description: input.description ?? null,
    });

    return mapCategory(category);
  } catch (error) {
    if (error.code === "23505") {
      throw httpError(409, "A category with this slug already exists.");
    }

    throw error;
  }
};

/**
 * =========================================================
 *  UPDATE CATEGORY
 * =========================================================
 */
export const updateCategory = async (id, input) => {
  if (!isUuid(id)) {
    throw httpError(400, "Invalid category UUID.");
  }

  const existing = await categoriesRepository.findCategoryById(id);

  if (!existing) {
    throw httpError(404, "Category not found.");
  }

  const name = input.name === undefined ? undefined : input.name.trim();

  let slug;

  if (input.slug !== undefined) {
    slug = makeSlug(input.slug);
  } else if (name !== undefined) {
    slug = makeSlug(name);
  }

  if (slug !== undefined && !slug) {
    throw httpError(400, "A valid category slug is required.");
  }

  try {
    const category = await categoriesRepository.updateCategory(id, {
      name,
      slug,
      description: input.description,
      isActive: input.isActive,
    });

    if (!category) {
      throw httpError(404, "Category not found.");
    }

    return mapCategory(category);
  } catch (error) {
    if (error.code === "23505") {
      throw httpError(409, "A category with this slug already exists.");
    }

    throw error;
  }
};

/**
 * =========================================================
 *  UPDATE CATEGORY ACTIVE STATUS
 * =========================================================
 */
export const setCategoryActive = async (id, isActive) => {
  if (!isUuid(id)) {
    throw httpError(400, "Invalid category UUID.");
  }

  if (typeof isActive !== "boolean") {
    throw httpError(400, "isActive must be a boolean.");
  }

  const category = await categoriesRepository.updateCategoryActiveStatus(
    id,
    isActive,
  );

  if (!category) {
    throw httpError(404, "Category not found.");
  }

  return mapCategory(category);
};
