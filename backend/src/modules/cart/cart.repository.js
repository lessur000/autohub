import { pool } from "../../config/database.js";

/**
 * =========================================================
 *  GET USER CART
 * =========================================================
 */
export const findCartByUserId = async (userId, db = pool) => {
  const result = await db.query(
    `
      SELECT
        ci.id,
        ci.user_id,
        ci.product_id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.sku,
        p.name,
        p.slug,
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
      FROM public.cart_items ci
      INNER JOIN public.products p
        ON p.id = ci.product_id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

/**
 * =========================================================
 *  FIND CART ITEM
 * =========================================================
 */
export const findCartItem = async (userId, productId, db = pool) => {
  const result = await db.query(
    `
      SELECT id, user_id, product_id, quantity
      FROM public.cart_items
      WHERE user_id = $1 AND product_id = $2
      LIMIT 1
    `,
    [userId, productId],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  FIND ACTIVE PRODUCT
 * =========================================================
 */
export const findActiveProduct = async (productId, db = pool) => {
  const result = await db.query(
    `
      SELECT id, name, price, currency, stock_quantity, is_active
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
 *  INSERT CART ITEM
 * =========================================================
 */
export const insertCartItem = async (
  userId,
  productId,
  quantity,
  db = pool,
) => {
  const result = await db.query(
    `
      INSERT INTO public.cart_items (
        user_id,
        product_id,
        quantity
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET
        quantity = public.cart_items.quantity + EXCLUDED.quantity,
        updated_at = NOW()
      RETURNING *
    `,
    [userId, productId, quantity],
  );

  return result.rows[0];
};

/**
 * =========================================================
 *  UPDATE CART ITEM QUANTITY
 * =========================================================
 */
export const updateCartItemQuantity = async (
  userId,
  productId,
  quantity,
  db = pool,
) => {
  const result = await db.query(
    `
      UPDATE public.cart_items
      SET quantity = $3,
          updated_at = NOW()
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `,
    [userId, productId, quantity],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  REMOVE CART ITEM
 * =========================================================
 */
export const removeCartItem = async (userId, productId, db = pool) => {
  const result = await db.query(
    `
      DELETE FROM public.cart_items
      WHERE user_id = $1 AND product_id = $2
      RETURNING id
    `,
    [userId, productId],
  );

  return result.rowCount > 0;
};

/**
 * =========================================================
 *  CLEAR USER CART
 * =========================================================
 */
export const clearCart = async (userId, db = pool) => {
  await db.query(`DELETE FROM public.cart_items WHERE user_id = $1`, [userId]);
};
