import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is missing.",
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.sub !== "string" ||
      !decoded.sub.trim()
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    req.user = {
      id: decoded.sub,
      ...(typeof decoded.role === "string" ? { role: decoded.role } : {}),
    };

    return next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token.",
      });
    }

    return next(error);
  }
};
