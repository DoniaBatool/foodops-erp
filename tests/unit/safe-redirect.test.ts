import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/safe-redirect";

describe("safeNextPath", () => {
  it("keeps same-site relative paths", () => {
    expect(safeNextPath("/items?page=2")).toBe("/items?page=2");
  });

  it.each([null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "items"])(
    "falls back for unsafe value %s",
    (value) => {
      expect(safeNextPath(value)).toBe("/dashboard");
    },
  );
});
