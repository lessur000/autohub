import * as adminRepository from "../../modules/admin/admin.repository.js";

export const getDashboardSummary = async () => {
  return adminRepository.getDashboardSummary();
};

export const getRecentOrders = async (query = {}) => {
  const parsedLimit = Number.parseInt(query.limit, 10) || 10;
  const limit = Math.min(50, Math.max(1, parsedLimit));

  return adminRepository.findRecentOrders(limit);
};
