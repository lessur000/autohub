/**
 * =========================================================
 *  CATEGORIES REPOSITORY
 * =========================================================
 */

import { pool } from "../../config/database.js";

/**
 * =========================================================
 *  GET ALL CATEGORIES
 * =========================================================
 */
export const findCategories = async (
  { limit, offset, includeInactive = false },
  db = pool,
) => {
  const { rows } = await db.query(
    `
      SELECT
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM public.categories
      WHERE ($1::boolean OR is_active = TRUE)
      ORDER BY name ASC
      LIMIT $2 OFFSET $3
    `,
    [includeInactive, limit, offset],
  );

  return rows;
};

/**
 * =========================================================
 *  COUNT CATEGORIES
 * =========================================================
 */
export const countCategories = async (includeInactive = false, db = pool) => {
  const { rows } = await db.query(
    `
      SELECT COUNT(*)::int AS count
      FROM public.categories
      WHERE ($1::boolean OR is_active = TRUE)
    `,
    [includeInactive],
  );

  return rows[0].count;
};

/**
 * =========================================================
 *  FIND CATEGORY BY ID
 * =========================================================
 */
export const findCategoryById = async (id, db = pool) => {
  const { rows } = await db.query(
    `
      SELECT
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM public.categories
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ?? null;
};

/**
 * =========================================================
 *  CREATE CATEGORY
 * =========================================================
 */
export const createCategory = async (
  { name, slug, description },
  db = pool,
) => {
  const { rows } = await db.query(
    `
      INSERT INTO public.categories (
        name,
        slug,
        description
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
    `,
    [name, slug, description ?? null],
  );

  return rows[0];
};

/**
 * =========================================================
 *  UPDATE CATEGORY
 * =========================================================
 */
export const updateCategory = async (
  id,
  { name, slug, description, isActive },
  db = pool,
) => {
  const { rows } = await db.query(
    `
      UPDATE public.categories
      SET
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        description = CASE
          WHEN $4::boolean THEN $5
          ELSE description
        END,
        is_active = COALESCE($6, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
    `,
    [
      id,
      name ?? null,
      slug ?? null,
      description !== undefined,
      description ?? null,
      isActive ?? null,
    ],
  );

  return rows[0] ?? null;
};

/**
 * =========================================================
 *  UPDATE CATEGORY ACTIVE STATUS
 * =========================================================
 */
export const updateCategoryActiveStatus = async (id, isActive, db = pool) => {
  const { rows } = await db.query(
    `
      UPDATE public.categories
      SET
        is_active = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
    `,
    [id, isActive],
  );

  return rows[0] ?? null;
};
