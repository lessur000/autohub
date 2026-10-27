import { pool } from "../../config/database.js";

export const getDashboardSummary = async (db = pool) => {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM public.users) AS total_users,
      (SELECT COUNT(*)::int FROM public.products) AS total_products,
      (
        SELECT COUNT(*)::int
        FROM public.products
        WHERE is_active = TRUE
      ) AS active_products,
      (SELECT COUNT(*)::int FROM public.orders) AS total_orders,
      (
        SELECT COUNT(*)::int
        FROM public.orders
        WHERE status = 'pending'
      ) AS pending_orders,
      (
        SELECT COUNT(*)::int
        FROM public.contact_messages
        WHERE status = 'new'
      ) AS new_contact_messages,
      (
        SELECT COUNT(*)::int
        FROM public.refund_requests
        WHERE status = 'requested'
      ) AS pending_refunds,
      (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM public.orders
        WHERE status <> 'cancelled'
      ) AS order_value
  `);

  const row = result.rows[0];

  return {
    totalUsers: row.total_users,
    totalProducts: row.total_products,
    activeProducts: row.active_products,
    totalOrders: row.total_orders,
    pendingOrders: row.pending_orders,
    newContactMessages: row.new_contact_messages,
    pendingRefunds: row.pending_refunds,
    orderValue: Number(row.order_value),
  };
};

export const findRecentOrders = async (limit = 10, db = pool) => {
  const result = await db.query(
    `
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.currency,
        o.placed_at,
        u.full_name AS customer_name,
        u.email AS customer_email
      FROM public.orders o
      JOIN public.users u ON u.id = o.user_id
      ORDER BY o.placed_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return result.rows.map((row) => ({
    ...row,
    total_amount: Number(row.total_amount),
    currency: row.currency.trim(),
  }));
};
