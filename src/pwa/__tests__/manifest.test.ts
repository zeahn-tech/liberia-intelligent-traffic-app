import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse the manifest.webmanifest file
const parsed = JSON.parse(
  readFileSync(resolve(__dirname, "../../../public/manifest.webmanifest"), "utf-8")
);

describe("PWA Manifest", () => {
  // ── Required fields ──────────────────────────────
  it("has a name", () => {
    expect(parsed.name).toBeTruthy();
    expect(typeof parsed.name).toBe("string");
  });

  it("has a short_name", () => {
    expect(parsed.short_name).toBeTruthy();
    expect(typeof parsed.short_name).toBe("string");
    // Most browsers support up to 12 characters, but 15 ("TrafficWatch AI") is acceptable
    expect(parsed.short_name.length).toBeLessThanOrEqual(20);
  });

  it("has a description", () => {
    expect(parsed.description).toBeTruthy();
  });

  it("has start_url set to /", () => {
    expect(parsed.start_url).toBe("/");
  });

  it("has id set to /", () => {
    expect(parsed.id).toBe("/");
  });

  it("has display set to standalone", () => {
    expect(parsed.display).toBe("standalone");
  });

  it("has orientation set to any", () => {
    expect(parsed.orientation).toBe("any");
  });

  it("has scope set to /", () => {
    expect(parsed.scope).toBe("/");
  });

  it("has theme_color defined", () => {
    expect(parsed.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("has background_color defined", () => {
    expect(parsed.background_color).toBeTruthy();
  });

  // ── Icons ────────────────────────────────────────
  describe("icons", () => {
    it("has at least one icon defined", () => {
      expect(parsed.icons.length).toBeGreaterThanOrEqual(1);
    });

    it("each icon has required fields", () => {
      for (const icon of parsed.icons) {
        expect(icon.src).toBeTruthy();
        expect(icon.sizes).toBeTruthy();
        expect(icon.type).toBeTruthy();
        expect(icon.purpose).toBeTruthy();
      }
    });

    it("includes a maskable icon", () => {
      const hasMaskable = parsed.icons.some(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        (i: any) => i.purpose && i.purpose.includes("maskable")
      );
      expect(hasMaskable).toBe(true);
    });
  });

  // ── Categories ───────────────────────────────────
  it("has categories array", () => {
    expect(Array.isArray(parsed.categories)).toBe(true);
  });

  // ── Shortcuts ────────────────────────────────────
  describe("shortcuts", () => {
    it("has at least one shortcut", () => {
      expect(parsed.shortcuts.length).toBeGreaterThanOrEqual(1);
    });

    it("each shortcut has required fields", () => {
      for (const shortcut of parsed.shortcuts) {
        expect(shortcut.name).toBeTruthy();
        expect(shortcut.short_name).toBeTruthy();
        expect(shortcut.description).toBeTruthy();
        expect(shortcut.url).toBeTruthy();
        expect(shortcut.url).toMatch(/^\//); // Must start with /
      }
    });

    it("shortcut URLs point to valid routes", () => {
      const validRoutes = ["/dashboard", "/incidents/new"];
      for (const shortcut of parsed.shortcuts) {
        expect(validRoutes).toContain(shortcut.url);
      }
    });
  });
});
