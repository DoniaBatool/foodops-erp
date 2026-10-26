import { z } from "zod";

export const COUNTRIES = {
  GB: { label: "United Kingdom", currency: "GBP", timezone: "Europe/London" },
  US: { label: "United States", currency: "USD", timezone: "America/New_York" },
} as const;

export const createOrganisationSchema = z.object({
  name: z.string().trim().min(2, "Enter your company name.").max(200),
  country: z.enum(["GB", "US"]),
  // Kept as a string: money/percentages never pass through JS floats.
  defaultVatRate: z
    .string()
    .trim()
    .regex(/^\d{1,2}(\.\d{1,2})?$/, "Enter a rate like 0 or 20.")
    .refine((v) => Number.parseFloat(v) <= 100, "Rate must be 100 or less."),
});

export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>;

/** 'Hillside Bakehouse Ltd' -> 'hillside-bakehouse-ltd' (3–40 chars, spec 7.4 slug check). */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base.length >= 3 ? base : `org-${base}`.slice(0, 40);
}
