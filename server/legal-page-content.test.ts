import { describe, expect, it } from "vitest";
import { infoPageContent } from "../client/src/pages/InfoPage";

describe("legal page content", () => {
  it("keeps legal pages as explicit completion templates without invented provider details", () => {
    expect(infoPageContent.impressum.label).toContain("Angaben ergänzen");
    expect(infoPageContent.datenschutz.label).toContain("Angaben ergänzen");
    expect(infoPageContent.impressum.sections).toHaveLength(4);
    expect(infoPageContent.datenschutz.sections).toHaveLength(5);
    expect(infoPageContent.impressum.sections?.[0]?.value).toContain("BITTE VOLLSTÄNDIGEN NAMEN");
  });
});
