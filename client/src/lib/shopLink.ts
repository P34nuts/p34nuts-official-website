const fallbackShopHref = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/shop`;
const configuredShopUrl = import.meta.env.VITE_SHOP_URL?.trim();

function getConfiguredShopHref(): string {
  if (!configuredShopUrl) return fallbackShopHref;

  try {
    const url = new URL(configuredShopUrl);
    return url.protocol === "https:" ? url.toString() : fallbackShopHref;
  } catch {
    return fallbackShopHref;
  }
}

/**
 * The artist site always exposes a shop entry. Until the independent storefront
 * is deployed, it resolves to the branded internal gateway. Production can
 * switch every navigation surface by providing an HTTPS VITE_SHOP_URL.
 */
export const shopHref = getConfiguredShopHref();
