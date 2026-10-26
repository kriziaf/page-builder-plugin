import type { PageIR } from "../ir/types";

// Template A: hero + Overview Card section + CTA band. Content is seeded locally; no model calls.
// Token names are the Leaf variable names with "/" -> "." (e.g. "base/spacing/24" -> "base.spacing.24").
// Only tokens verified in the Leaf copy file are used. "color/content/inverse" was not found,
// so text stays on light backgrounds.
export function templateA(seed: { headline: string; body: string; cta: string }): PageIR {
  return {
    template: "A",
    name: "Template A — Sample",
    width: 1440,
    root: {
      kind: "frame",
      name: "Page",
      layout: { direction: "column", gap: { token: "base.spacing.32" }, padding: { token: "base.spacing.40" } },
      fill: { token: "color.bg.default" },
      children: [
        {
          kind: "frame",
          name: "Hero",
          layout: { direction: "column", gap: { token: "base.spacing.16" }, padding: { token: "base.spacing.40" }, align: "start" },
          fill: { token: "color.bg.default" },
          radius: { token: "base.border-radius.24" },
          width: "fill",
          children: [
            { kind: "text", name: "Headline", text: seed.headline, style: "display", color: { token: "color.content.brand-strong" }, width: "fill" },
            { kind: "text", name: "Body", text: seed.body, style: "body", color: { token: "color.content.default" }, width: "fill" },
          ],
        },
        // Leaf "Overview Card" is a full section (component set, 10 variants). Default variant for now.
        { kind: "instance", name: "Overview Card", componentKey: "overview-cards" },
        {
          kind: "frame",
          name: "CTA Band",
          layout: { direction: "row", justify: "between", align: "center", padding: { token: "base.spacing.24" } },
          fill: { token: "color.bg.default" },
          radius: { token: "base.border-radius.16" },
          width: "fill",
          children: [
            { kind: "text", name: "CTA Label", text: seed.cta, style: "heading", color: { token: "color.content.brand-strong" } },
          ],
        },
      ],
    },
  };
}
