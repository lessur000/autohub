export const pick = (object, allowedKeys) => {
  if (!object || typeof object !== "object" || Array.isArray(object)) {
    return {};
  }

  return Object.fromEntries(
    allowedKeys
      .filter((key) => Object.prototype.hasOwnProperty.call(object, key))
      .map((key) => [key, object[key]]),
  );
};
