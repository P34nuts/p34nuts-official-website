import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { primaryNav } from "../client/src/data/artistData";
import { isExternalShopHref, shopHref } from "../client/src/lib/shopLink";

const projectRoot = resolve(import.meta.dirname, "..");

describe("hybrid storefront handoff", () => {
  it("keeps commerce separate while the static route can hand off to a configured HTTPS storefront", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
    const redirect = readFileSync(resolve(projectRoot, "client/src/pages/ShopRedirect.tsx"), "utf8");

    expect(shopHref === "/shop" || shopHref.startsWith("https://")).toBe(true);
    expect(isExternalShopHref).toBe(shopHref !== "/shop");
    expect(primaryNav).toContainEqual({ label: "Shop", href: shopHref });
    expect(app).toContain('<Route path="/shop"><Suspense fallback={<RouteFallback />}><ShopRedirect /></Suspense></Route>');
    expect(home).toContain('href={shopHref}>Shop</a>');
    expect(redirect).toContain("window.location.replace(shopHref)");
    expect(redirect).toContain("SHOP JETZT ÖFFNEN");
    expect(redirect).toContain("isExternalShopHref");
  });
});
