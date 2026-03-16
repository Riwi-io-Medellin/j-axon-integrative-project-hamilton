const ARRAY_KEYS = [
  "data",
  "items",
  "rows",
  "results",
  "result",
  "tickets",
  "activos",
  "repuestos",
  "categorias",
  "categories",
  "usuarios",
  "mantenimientos"
];

const extractArray = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  for (const key of ARRAY_KEYS) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }
  return null;
};

export const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;

  let found = extractArray(payload);
  if (found) return found;

  if (payload && typeof payload === "object" && payload.data) {
    found = extractArray(payload.data);
    if (found) return found;

    if (payload.data && typeof payload.data === "object" && payload.data.data) {
      found = extractArray(payload.data.data);
      if (found) return found;
    }
  }

  return [];
};
