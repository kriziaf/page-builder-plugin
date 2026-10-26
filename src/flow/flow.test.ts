import { describe, expect, it } from "vitest";
import { PAGE_TYPES } from "./pageTypes";
import { PATTERNS } from "./patterns";
import { COMPONENT_REFS } from "../library/refs";
import { addable, addSection, moveSection, recommended, removeSection, validateGenerate } from "./sections";
import { buildFromSections } from "./build";

describe("page types", () => {
  it("offers the four spec types with non-empty section lists using known patterns", () => {
    expect(PAGE_TYPES.map((t) => t.id)).toEqual(["business", "article", "blog", "services"]);
    for (const t of PAGE_TYPES) {
      expect(t.sections.length).toBeGreaterThan(0);
      for (const s of t.sections) expect(PATTERNS.map((p) => p.id)).toContain(s.pattern);
    }
  });

  it("maps every component key to a known ref", () => {
    for (const p of PATTERNS) if (p.componentKey) expect(COMPONENT_REFS).toHaveProperty([p.componentKey]);
  });
});

describe("sections", () => {
  it("keeps required sections when removing", () => {
    const s = recommended("business");
    expect(removeSection(s, "hero-primary")).toEqual(s);
    expect(removeSection(s, "promo-banner").some((x) => x.pattern === "promo-banner")).toBe(false);
  });

  it("offers only unused patterns and never Hero Primary on Article", () => {
    const a = recommended("article");
    expect(addable("article", a)).not.toContain("hero-primary");
    expect(addable("article", a)).not.toContain("text-media");
    expect(addable("services", recommended("services"))).not.toContain("hero-primary");
    const b = removeSection(recommended("business"), "promo-banner");
    expect(addable("business", b)).toContain("promo-banner");
    expect(addSection("business", b, "promo-banner").slice(-1)[0].pattern).toBe("promo-banner");
  });

  it("reorders within bounds", () => {
    const s = recommended("services");
    expect(moveSection(s, s[1].pattern, -1)[0].pattern).toBe(s[1].pattern);
    expect(moveSection(s, s[0].pattern, -1)).toEqual(s);
  });

  it("requires audience, sections and required patterns to generate", () => {
    const s = recommended("services");
    expect(() => validateGenerate("services", { audience: " " }, s)).toThrow(/audience/);
    expect(() => validateGenerate("services", { audience: "a" }, [])).toThrow(/at least one/);
    expect(() => validateGenerate("services", { audience: "a" }, s.slice(1))).toThrow(/required/);
    expect(() => validateGenerate("services", { audience: "a" }, s)).not.toThrow();
  });
});

describe("buildFromSections", () => {
  it("stacks sections in order, using placeholders for missing components", () => {
    const s = recommended("business");
    const page = buildFromSections("business", { audience: "Members" }, s, (k) => k === "overview-cards");
    const kinds = page.root.children.map((c) => `${c.kind}:${c.name}`);
    expect(kinds[0]).toBe("frame:Hero Primary (placeholder)");
    expect(kinds[1]).toBe("instance:Overview Cards");
    expect(page.root.children).toHaveLength(s.length);
    expect(page.name).toBe("Business Page - Members");
  });
});
