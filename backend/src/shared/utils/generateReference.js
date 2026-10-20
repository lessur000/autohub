import { randomBytes } from "node:crypto";

export const generateReference = (prefix = "AH") => {
  if (!/^[A-Z0-9]{2,8}$/.test(prefix)) {
    throw new TypeError(
      "Prefix must contain 2–8 uppercase letters or numbers.",
    );
  }

  return `${prefix}-${randomBytes(12).toString("hex").toUpperCase()}`;
};
