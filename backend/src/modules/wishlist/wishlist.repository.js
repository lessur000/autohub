import { pool } from "../../config/database.js";

/**
 * =========================================================
 *  GET USER WISHLIST
 * =========================================================
 */
export const findWishlist = async (userId, db = pool) => {
  const result = await db.query(
    `
      SELECT
        w.product_id,
        w.created_at AS added_at,
        p.sku,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.currency,
        p.stock_quantity,
        p.is_active,
        (
          SELECT pi.image_url
          FROM public.product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC, pi.created_at ASC
          LIMIT 1
        ) AS image_url
      FROM public.wishlist w
      JOIN public.products p ON p.id = w.product_id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

/**
 * =========================================================
 *  ADD PRODUCT TO WISHLIST
 * =========================================================
 */
export const addWishlistItem = async (userId, productId, db = pool) => {
  const result = await db.query(
    `
      INSERT INTO public.wishlist (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *
    `,
    [userId, productId],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  CHECK ACTIVE PRODUCT
 * =========================================================
 */
export const findActiveProduct = async (productId, db = pool) => {
  const result = await db.query(
    `
      SELECT id, name, is_active
      FROM public.products
      WHERE id = $1 AND is_active = TRUE
      LIMIT 1
    `,
    [productId],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  REMOVE WISHLIST ITEM
 * =========================================================
 */
export const removeWishlistItem = async (userId, productId, db = pool) => {
  const result = await db.query(
    `
      DELETE FROM public.wishlist
      WHERE user_id = $1 AND product_id = $2
      RETURNING product_id
    `,
    [userId, productId],
  );

  return result.rowCount > 0;
};

/**
 * =========================================================
 *  CLEAR WISHLIST
 * =========================================================
 */
export const clearWishlist = async (userId, db = pool) => {
  await db.query(`DELETE FROM public.wishlist WHERE user_id = $1`, [userId]);
};
