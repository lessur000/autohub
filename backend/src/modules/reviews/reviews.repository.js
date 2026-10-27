import { pool } from "../../config/database.js";

/**
 * =========================================================
 *  GET PUBLISHED PRODUCT REVIEWS
 * =========================================================
 */
export const findProductReviews = async (
  productId,
  { limit, offset },
  db = pool,
) => {
  const result = await db.query(
    `
      SELECT
        r.id,
        r.product_id,
        r.user_id,
        r.order_item_id,
        r.rating,
        r.title,
        r.body,
        r.created_at,
        u.full_name AS reviewer_name
      FROM public.product_reviews r
      JOIN public.users u ON u.id = r.user_id
      WHERE r.product_id = $1
        AND r.is_published = TRUE
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [productId, limit, offset],
  );

  return result.rows;
};

/**
 * =========================================================
 *  CREATE REVIEW
 * =========================================================
 */
export const insertReview = async (data, db = pool) => {
  const result = await db.query(
    `
      INSERT INTO public.product_reviews (
        product_id,
        user_id,
        order_item_id,
        rating,
        title,
        body,
        is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, FALSE)
      RETURNING *
    `,
    [
      data.productId,
      data.userId,
      data.orderItemId ?? null,
      data.rating,
      data.title ?? null,
      data.body ?? null,
    ],
  );

  return result.rows[0];
};

/**
 * =========================================================
 *  CHECK EXISTING USER REVIEW
 * =========================================================
 */
export const findUserReview = async (productId, userId, db = pool) => {
  const result = await db.query(
    `
      SELECT *
      FROM public.product_reviews
      WHERE product_id = $1 AND user_id = $2
      LIMIT 1
    `,
    [productId, userId],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  VERIFY PURCHASED ORDER ITEM
 * =========================================================
 */
export const findPurchasedOrderItem = async (
  orderItemId,
  productId,
  userId,
  db = pool,
) => {
  const result = await db.query(
    `
      SELECT oi.id
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = $1
        AND oi.product_id = $2
        AND o.user_id = $3
        AND o.status = 'delivered'
      LIMIT 1
    `,
    [orderItemId, productId, userId],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  GET ALL REVIEWS FOR ADMIN
 * =========================================================
 */
export const findAllReviews = async ({ limit, offset }, db = pool) => {
  const result = await db.query(
    `
      SELECT
        r.*,
        p.name AS product_name,
        u.full_name AS reviewer_name
      FROM public.product_reviews r
      JOIN public.products p ON p.id = r.product_id
      JOIN public.users u ON u.id = r.user_id
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );

  return result.rows;
};

/**
 * =========================================================
 *  PUBLISH / UNPUBLISH REVIEW
 * =========================================================
 */
export const setReviewPublished = async (reviewId, isPublished, db = pool) => {
  const result = await db.query(
    `
      UPDATE public.product_reviews
      SET is_published = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [reviewId, isPublished],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  DELETE REVIEW
 * =========================================================
 */
export const deleteReview = async (reviewId, userId, isAdmin, db = pool) => {
  const result = await db.query(
    `
      DELETE FROM public.product_reviews
      WHERE id = $1
        AND ($2::uuid IS NULL OR user_id = $2)
        AND ($3::boolean = TRUE OR is_published = FALSE)
      RETURNING id
    `,
    [reviewId, isAdmin ? null : userId, isAdmin],
  );

  return result.rowCount > 0;
};
