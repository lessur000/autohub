import { pool } from "../../config/database.js";

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

export const findInventory = async ({ search, limit, offset }, db = pool) => {
  const result = await db.query(
    `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.stock_quantity,
        p.is_active,
        p.updated_at
      FROM public.products p
      WHERE (
        $1::text IS NULL
        OR p.name ILIKE '%' || $1 || '%'
        OR p.sku ILIKE '%' || $1 || '%'
      )
      ORDER BY p.name ASC
      LIMIT $2 OFFSET $3
    `,
    [search || null, limit, offset],
  );

  return result.rows;
};

export const findInventoryMovements = async (
  { productId, limit, offset },
  db = pool,
) => {
  const result = await db.query(
    `
      SELECT
        im.*,
        p.sku,
        p.name AS product_name,
        u.full_name AS actor_name
      FROM public.inventory_movements im
      JOIN public.products p ON p.id = im.product_id
      LEFT JOIN public.users u ON u.id = im.actor_user_id
      WHERE ($1::uuid IS NULL OR im.product_id = $1)
      ORDER BY im.created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [productId || null, limit, offset],
  );

  return result.rows;
};

export const adjustStock = async (
  { productId, movementType, quantityDelta, note, actorUserId },
  db,
) => {
  const productResult = await db.query(
    `
      SELECT id, sku, name, stock_quantity
      FROM public.products
      WHERE id = $1
      FOR UPDATE
    `,
    [productId],
  );

  const product = productResult.rows[0];

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const nextQuantity = product.stock_quantity + quantityDelta;

  if (nextQuantity < 0) {
    const error = new Error("Stock quantity cannot become negative.");
    error.statusCode = 409;
    throw error;
  }

  await db.query(
    `
      UPDATE public.products
      SET stock_quantity = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [productId, nextQuantity],
  );

  const movementResult = await db.query(
    `
      INSERT INTO public.inventory_movements (
        product_id,
        movement_type,
        quantity_delta,
        reference_type,
        note,
        actor_user_id
      )
      VALUES ($1, $2, $3, 'manual_adjustment', $4, $5)
      RETURNING *
    `,
    [productId, movementType, quantityDelta, note ?? null, actorUserId],
  );

  return {
    product: {
      ...product,
      stock_quantity: nextQuantity,
    },
    movement: movementResult.rows[0],
  };
};
