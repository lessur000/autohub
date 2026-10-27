import { pool } from "../../config/database.js";

export const findProductById = async (productId, db = pool) => {
  const result = await db.query(
    `
      SELECT id, sku, name
      FROM public.products
      WHERE id = $1
      LIMIT 1
    `,
    [productId],
  );

  return result.rows[0] ?? null;
};

export const createProductImage = async (
  { productId, imageUrl, publicId, altText, sortOrder },
  db = pool,
) => {
  const result = await db.query(
    `
      INSERT INTO public.product_images (
        product_id,
        image_url,
        cloudinary_public_id,
        alt_text,
        sort_order
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        product_id,
        image_url,
        cloudinary_public_id,
        alt_text,
        sort_order,
        created_at
    `,
    [productId, imageUrl, publicId, altText, sortOrder],
  );

  return result.rows[0];
};

export const findProductImages = async (productId, db = pool) => {
  const result = await db.query(
    `
      SELECT
        id,
        product_id,
        image_url,
        cloudinary_public_id,
        alt_text,
        sort_order,
        created_at
      FROM public.product_images
      WHERE product_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `,
    [productId],
  );

  return result.rows;
};

export const findProductImageById = async (imageId, db = pool) => {
  const result = await db.query(
    `
      SELECT
        id,
        product_id,
        image_url,
        cloudinary_public_id,
        alt_text,
        sort_order,
        created_at
      FROM public.product_images
      WHERE id = $1
      LIMIT 1
    `,
    [imageId],
  );

  return result.rows[0] ?? null;
};

export const deleteProductImageRecord = async (imageId, db = pool) => {
  const result = await db.query(
    `
      DELETE FROM public.product_images
      WHERE id = $1
      RETURNING id, product_id, cloudinary_public_id
    `,
    [imageId],
  );

  return result.rows[0] ?? null;
};
