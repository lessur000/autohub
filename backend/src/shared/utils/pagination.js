export const parsePagination = (
  query,
  { defaultLimit = 20, maxLimit = 100 } = {},
) => {
  const parsePositiveInteger = (value, fallback) => {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      return fallback;
    }

    return parsed;
  };

  const page = parsePositiveInteger(query.page, 1);
  const requestedLimit = parsePositiveInteger(query.limit, defaultLimit);

  const limit = Math.min(requestedLimit, maxLimit);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};
