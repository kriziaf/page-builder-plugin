import type { PageIR } from "../ir/types";

// Services templates A-D mirror the example pages in the library's "test-02 - content architecture"
// section (file BYYBVG0tM2CmNo7p4kC96W). Each is a vertical stack of library instances at 1440px.
// "CTA Banner" in the examples maps to the promo-banner component.
// Placeholder copy stays until text-layer overrides are added per component.
type Key =
  | "secondary-hero" | "expanded-text" | "highlight-band" | "text-media" | "accent-card"
  | "overview-cards" | "bullet-text" | "promo-banner" | "two-col-form";

const NAMES: Record<Key, string> = {
  "secondary-hero": "Hero",
  "expanded-text": "Expanded text",
  "highlight-band": "Highlight band",
  "text-media": "Text and media",
  "accent-card": "Accent cards",
  "overview-cards": "Overview cards",
  "bullet-text": "Bullet text",
  "promo-banner": "CTA banner",
  "two-col-form": "Inquiry form",
};

const stack = (id: string, label: string, keys: Key[]): PageIR => ({
  template: id,
  name: label,
  width: 1440,
  root: {
    kind: "frame",
    name: label,
    layout: { direction: "column", gap: 0, padding: 0 },
    fill: { token: "color.bg.default" },
    children: keys.map((k) => ({ kind: "instance" as const, name: NAMES[k], componentKey: k })),
  },
});

// A: 01 Virtual Care Overview
export const servicesA = () => stack("services-a", "Services template - A", [
  "secondary-hero", "expanded-text", "highlight-band", "text-media", "accent-card", "promo-banner",
]);
// B: 02 Urgent Care & Walk-ins
export const servicesB = () => stack("services-b", "Services template - B", [
  "secondary-hero", "overview-cards", "bullet-text", "highlight-band", "overview-cards", "promo-banner", "promo-banner",
]);
// C: 04 Mental Health & Therapy
export const servicesC = () => stack("services-c", "Services template - C", [
  "secondary-hero", "expanded-text", "bullet-text", "highlight-band", "overview-cards", "promo-banner", "promo-banner",
]);
// D: 05 Primary Care at Home
export const servicesD = () => stack("services-d", "Services template - D", [
  "secondary-hero", "expanded-text", "highlight-band", "bullet-text", "overview-cards", "text-media", "promo-banner",
]);
