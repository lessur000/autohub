const normalizeRole = (role) =>
  typeof role === "string" ? role.trim().toLowerCase() : "";

export const authorize = (...allowedRoles) => {
  const roles = allowedRoles.map(normalizeRole).filter(Boolean);

  if (roles.length === 0) {
    throw new Error("authorize() requires at least one allowed role.");
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  };
};
