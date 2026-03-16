export function normalizePagination({ limit, offset, defaultLimit = 100, maxLimit = 500 } = {}) {
    const parsedLimit = limit === undefined ? defaultLimit : Number(limit);
    const parsedOffset = offset === undefined ? 0 : Number(offset);

    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > maxLimit) {
        throw { status: 400, message: `limit debe ser entero entre 1 y ${maxLimit}` };
    }
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0 || parsedOffset > 1000000) {
        throw { status: 400, message: 'offset debe ser entero >= 0' };
    }

    return { limit: parsedLimit, offset: parsedOffset };
}
