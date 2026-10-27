import { pool } from "../../config/database.js";

export const findAddresses = async (userId, db = pool) => {
  const result = await db.query(
    `
      SELECT *
      FROM public.shipping_addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

export const findAddressById = async (addressId, userId, db = pool) => {
  const result = await db.query(
    `
      SELECT *
      FROM public.shipping_addresses
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [addressId, userId],
  );

  return result.rows[0] ?? null;
};

export const insertAddress = async (userId, data, db = pool) => {
  const result = await db.query(
    `
      INSERT INTO public.shipping_addresses (
        user_id, recipient_name, phone, address_line1,
        address_line2, barangay, city, province,
        postal_code, country_code, is_default
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `,
    [
      userId,
      data.recipientName,
      data.phone,
      data.addressLine1,
      data.addressLine2 ?? null,
      data.barangay ?? null,
      data.city,
      data.province,
      data.postalCode ?? null,
      data.countryCode ?? "PH",
      data.isDefault ?? false,
    ],
  );

  return result.rows[0];
};

export const updateAddress = async (addressId, userId, data, db = pool) => {
  const result = await db.query(
    `
      UPDATE public.shipping_addresses
      SET recipient_name = $3,
          phone = $4,
          address_line1 = $5,
          address_line2 = $6,
          barangay = $7,
          city = $8,
          province = $9,
          postal_code = $10,
          country_code = $11,
          updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [
      addressId,
      userId,
      data.recipientName,
      data.phone,
      data.addressLine1,
      data.addressLine2 ?? null,
      data.barangay ?? null,
      data.city,
      data.province,
      data.postalCode ?? null,
      data.countryCode ?? "PH",
    ],
  );

  return result.rows[0] ?? null;
};

export const deleteAddress = async (addressId, userId, db = pool) => {
  const result = await db.query(
    `
      DELETE FROM public.shipping_addresses
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [addressId, userId],
  );

  return result.rowCount > 0;
};

export const clearDefaultAddresses = async (userId, db) => {
  await db.query(
    `
      UPDATE public.shipping_addresses
      SET is_default = FALSE, updated_at = NOW()
      WHERE user_id = $1 AND is_default = TRUE
    `,
    [userId],
  );
};

export const setDefaultAddress = async (addressId, userId, db = pool) => {
  const result = await db.query(
    `
      UPDATE public.shipping_addresses
      SET is_default = TRUE, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [addressId, userId],
  );

  return result.rows[0] ?? null;
};

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
