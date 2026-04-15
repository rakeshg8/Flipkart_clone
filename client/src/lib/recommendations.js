const VIEWED_PRODUCTS_KEY = "fk_viewed_product_ids";
const CATEGORY_SCORE_KEY = "fk_category_scores";
const MAX_VIEWED_PRODUCTS = 20;

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const getRecentViewedIds = () => {
  if (typeof window === "undefined") return [];
  const ids = safeParse(window.localStorage.getItem(VIEWED_PRODUCTS_KEY), []);
  return Array.isArray(ids) ? ids : [];
};

export const getTopCategorySlugs = (limit = 2) => {
  if (typeof window === "undefined") return [];
  const scores = safeParse(window.localStorage.getItem(CATEGORY_SCORE_KEY), {});
  if (!scores || typeof scores !== "object") return [];

  return Object.entries(scores)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, limit)
    .map(([slug]) => slug);
};

export const trackProductView = (product) => {
  if (typeof window === "undefined" || !product?.id) return;

  const numericId = Number(product.id);
  if (!Number.isFinite(numericId)) return;

  const currentIds = getRecentViewedIds().filter((id) => id !== numericId);
  const nextIds = [numericId, ...currentIds].slice(0, MAX_VIEWED_PRODUCTS);
  window.localStorage.setItem(VIEWED_PRODUCTS_KEY, JSON.stringify(nextIds));

  const slug = product?.categories?.slug;
  if (!slug) return;

  const scores = safeParse(window.localStorage.getItem(CATEGORY_SCORE_KEY), {});
  const nextScores = {
    ...scores,
    [slug]: Number(scores?.[slug] || 0) + 1
  };
  window.localStorage.setItem(CATEGORY_SCORE_KEY, JSON.stringify(nextScores));
};
