import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { primaryNav } from "../client/src/data/artistData";
import { shopHref } from "../client/src/lib/shopLink";
import { infoPageContent } from "../client/src/pages/InfoPage";

const projectRoot = resolve(import.meta.dirname, "..");

describe("hybrid storefront gateway", () => {
  it("exposes a visible internal SHOP entry while keeping commerce separate from the artist site", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");

    expect(shopHref).toBe("/shop");
    expect(primaryNav).toContainEqual({ label: "Shop", href: shopHref });
    expect(app).toContain('<Route path="/shop"><Suspense fallback={<RouteFallback />}><InfoPage kind="shop" /></Suspense></Route>');
    expect(home).toContain('href={shopHref}>Shop</a>');
    expect(infoPageContent.shop.copy).toContain("eigenständige Storefront");
    expect(infoPageContent.shop.sections).toHaveLength(3);
  });
});
