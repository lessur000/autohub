/**
 * =========================================================
 *  PRODUCTS REPOSITORY
 * =========================================================
 */

import { pool } from "../../config/database.js";

/**
 * =========================================================
 *  SHARED PRODUCT SELECT
 * =========================================================
 */
const PRODUCT_SELECT = `
  SELECT
    p.id,
    p.sku,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.currency,
    p.stock_quantity,
    p.is_active,
    p.created_at,
    p.updated_at,

    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', category.id,
            'name', category.name,
            'slug', category.slug
          )
          ORDER BY category.name
        )
        FROM public.product_categories pc
        JOIN public.categories category
          ON category.id = pc.category_id
        WHERE pc.product_id = p.id
      ),
      '[]'::jsonb
    ) AS categories,

    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', image.id,
            'imageUrl', image.image_url,
            'altText', image.alt_text,
            'sortOrder', image.sort_order
          )
          ORDER BY image.sort_order, image.created_at
        )
        FROM public.product_images image
        WHERE image.product_id = p.id
      ),
      '[]'::jsonb
    ) AS images

  FROM public.products p
`;

/**
 * =========================================================
 *  GET PRODUCTS
 * =========================================================
 */
export const findProducts = async ({
  limit,
  offset,
  search = "",
  categoryId = null,
  includeInactive = false,
}) => {
  const { rows } = await pool.query(
    `
      ${PRODUCT_SELECT}
      WHERE
        ($1::boolean OR p.is_active = TRUE)
        AND (
          $2 = ''
          OR p.name ILIKE '%' || $2 || '%'
          OR p.sku ILIKE '%' || $2 || '%'
          OR COALESCE(p.description, '') ILIKE '%' || $2 || '%'
        )
        AND (
          $3::uuid IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.product_categories filter_pc
            WHERE filter_pc.product_id = p.id
              AND filter_pc.category_id = $3
          )
        )
      ORDER BY p.created_at DESC
      LIMIT $4 OFFSET $5
    `,
    [includeInactive, search, categoryId, limit, offset],
  );

  return rows;
};

/**
 * =========================================================
 *  COUNT PRODUCTS
 * =========================================================
 */
export const countProducts = async ({
  search = "",
  categoryId = null,
  includeInactive = false,
}) => {
  const { rows } = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM public.products p
      WHERE
        ($1::boolean OR p.is_active = TRUE)
        AND (
          $2 = ''
          OR p.name ILIKE '%' || $2 || '%'
          OR p.sku ILIKE '%' || $2 || '%'
          OR COALESCE(p.description, '') ILIKE '%' || $2 || '%'
        )
        AND (
          $3::uuid IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.product_categories pc
            WHERE pc.product_id = p.id
              AND pc.category_id = $3
          )
        )
    `,
    [includeInactive, search, categoryId],
  );

  return rows[0].count;
};

/**
 * =========================================================
 *  FIND PRODUCT BY ID
 * =========================================================
 */
export const findProductById = async (
  id,
  { includeInactive = false } = {},
  db = pool,
) => {
  const { rows } = await db.query(
    `
      ${PRODUCT_SELECT}
      WHERE p.id = $1
        AND ($2::boolean OR p.is_active = TRUE)
      LIMIT 1
    `,
    [id, includeInactive],
  );

  return rows[0] ?? null;
};

/**
 * =========================================================
 *  FIND ACTIVE CATEGORIES
 * =========================================================
 */
export const findActiveCategories = async (categoryIds, db) => {
  if (categoryIds.length === 0) {
    return [];
  }

  const { rows } = await db.query(
    `
      SELECT id
      FROM public.categories
      WHERE id = ANY($1::uuid[])
        AND is_active = TRUE
    `,
    [categoryIds],
  );

  return rows;
};

/**
 * =========================================================
 *  CREATE PRODUCT
 * =========================================================
 */
export const insertProduct = async (input, db) => {
  const { rows } = await db.query(
    `
      INSERT INTO public.products (
        sku,
        name,
        slug,
        description,
        price,
        currency,
        stock_quantity,
        is_active
      )
      VALUES (
        $1, $2, $3, $4, $5,
        COALESCE($6, 'PHP'),
        $7,
        COALESCE($8, TRUE)
      )
      RETURNING id
    `,
    [
      input.sku,
      input.name,
      input.slug,
      input.description ?? null,
      input.price,
      input.currency ?? "PHP",
      input.stockQuantity ?? 0,
      input.isActive ?? true,
    ],
  );

  return rows[0].id;
};

/**
 * =========================================================
 *  REPLACE PRODUCT CATEGORIES
 * =========================================================
 */
export const replaceProductCategories = async (productId, categoryIds, db) => {
  await db.query(
    `
      DELETE FROM public.product_categories
      WHERE product_id = $1
    `,
    [productId],
  );

  for (const categoryId of categoryIds) {
    await db.query(
      `
        INSERT INTO public.product_categories (
          product_id,
          category_id
        )
        VALUES ($1, $2)
      `,
      [productId, categoryId],
    );
  }
};

/**
 * =========================================================
 *  UPDATE PRODUCT
 * =========================================================
 */
export const updateProduct = async (id, input, db) => {
  const { rows } = await db.query(
    `
      UPDATE public.products
      SET
        sku = COALESCE($2, sku),
        name = COALESCE($3, name),
        slug = COALESCE($4, slug),

        description = CASE
          WHEN $5::boolean THEN $6
          ELSE description
        END,

        price = COALESCE($7, price),
        currency = COALESCE($8, currency),
        stock_quantity = COALESCE($9, stock_quantity),
        is_active = COALESCE($10, is_active),
        updated_at = NOW()

      WHERE id = $1
      RETURNING id
    `,
    [
      id,
      input.sku ?? null,
      input.name ?? null,
      input.slug ?? null,
      input.description !== undefined,
      input.description ?? null,
      input.price ?? null,
      input.currency ?? null,
      input.stockQuantity ?? null,
      input.isActive ?? null,
    ],
  );

  return rows[0]?.id ?? null;
};

/**
 * =========================================================
 *  UPDATE PRODUCT ACTIVE STATUS
 * =========================================================
 */
export const updateProductActiveStatus = async (id, isActive) => {
  const { rows } = await pool.query(
    `
      UPDATE public.products
      SET
        is_active = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [id, isActive],
  );

  return rows[0]?.id ?? null;
};

/**
 * =========================================================
 *  DATABASE TRANSACTION
 * =========================================================
 */
export const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
