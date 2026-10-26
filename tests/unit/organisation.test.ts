import { describe, expect, it } from "vitest";

import { createOrganisationSchema, slugify } from "@/lib/validation/organisation";

describe("slugify", () => {
  it("makes a URL-safe slug that passes the DB check (^[a-z0-9-]{3,50}$)", () => {
    expect(slugify("Hillside Bakehouse Ltd")).toBe("hillside-bakehouse-ltd");
    expect(slugify("  Café & Co.  ")).toBe("cafe-co");
  });

  it("pads very short names", () => {
    expect(slugify("A")).toBe("org-a");
    expect(slugify("A")).toMatch(/^[a-z0-9-]{3,50}$/);
  });

  it("caps length at 40", () => {
    expect(slugify("x".repeat(80))).toHaveLength(40);
  });
});

describe("createOrganisationSchema", () => {
  it("accepts a valid UK org", () => {
    const r = createOrganisationSchema.safeParse({ name: "Hillside Bakehouse Ltd", country: "GB", defaultVatRate: "20" });
    expect(r.success).toBe(true);
  });

  it.each(["abc", "-1", "101", "20.555"])("rejects VAT rate %s", (rate) => {
    const r = createOrganisationSchema.safeParse({ name: "Test Co", country: "GB", defaultVatRate: rate });
    expect(r.success).toBe(false);
  });

  it("rejects unknown countries", () => {
    const r = createOrganisationSchema.safeParse({ name: "Test Co", country: "FR", defaultVatRate: "0" });
    expect(r.success).toBe(false);
  });
});
