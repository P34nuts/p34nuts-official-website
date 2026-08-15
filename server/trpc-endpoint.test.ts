import { describe, expect, it } from "vitest";
import { getTrpcEndpoint } from "../client/src/lib/trpcEndpoint";
import { GITHUB_PAGES_ORIGIN, getAllowedPublicOrigin } from "./_core/publicCors";

describe("GitHub Pages booking endpoint", () => {
  it("uses the configured Manus API origin for a static Pages build", () => {
    expect(getTrpcEndpoint("https://p34nutsart-jjmeco2k.manus.space", "https://p34nuts.github.io")).toBe("https://p34nutsart-jjmeco2k.manus.space/api/trpc");
  });

  it("permits CORS only for the configured GitHub Pages origin", () => {
    expect(getAllowedPublicOrigin(GITHUB_PAGES_ORIGIN)).toBe(GITHUB_PAGES_ORIGIN);
    expect(getAllowedPublicOrigin("https://untrusted.example")).toBeUndefined();
  });
});
