import { describe, it, expect } from "vitest";
import { TEMPLATES } from "./index";
import { COMPONENT_REFS } from "../library/refs";

describe("template registry", () => {
  it("has unique ids and only known components", () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    for (const t of TEMPLATES) {
      const walk = (n: any): void => {
        if (n.kind === "instance") expect(COMPONENT_REFS).toHaveProperty([n.componentKey]);
        (n.children ?? []).forEach(walk);
      };
      walk(t.build({ headline: "h", body: "b", cta: "c" }).root);
    }
  });
});
