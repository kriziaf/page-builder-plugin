// The fourteen approved patterns from the page-builder spec. componentKey points at a COMPONENT_REFS
// entry; patterns without one have no component in the library yet and render as a labeled placeholder.
export type PatternDef = {
  id: string;
  label: string;
  componentKey?: string;
  // Component-set variant property and its values; omit until verified in the library.
  variants?: { prop: string; values: string[] };
};

export const PATTERNS: PatternDef[] = [
  { id: "overview-cards", label: "Overview Cards", componentKey: "overview-cards" },
  { id: "accent-cards", label: "Accent Cards", componentKey: "accent-card" },
  { id: "graphic-cards", label: "Graphic Cards" },
  { id: "horizontal-cards", label: "Horizontal Cards" },
  { id: "external-link-cards", label: "External Link Cards" },
  { id: "bullet-image", label: "Bullet Image" },
  { id: "text-media", label: "Text Media", componentKey: "text-media" },
  { id: "expanded-text", label: "Expanded Text", componentKey: "expanded-text" },
  { id: "longform-text", label: "Longform Text" },
  { id: "hero-primary", label: "Hero Primary" },
  { id: "hero-secondary", label: "Hero Secondary", componentKey: "secondary-hero" },
  { id: "two-col-form", label: "Two-Col Form", componentKey: "two-col-form" },
  { id: "promo-banner", label: "Promo Banner Card", componentKey: "promo-banner" },
  { id: "highlight-band", label: "Highlight Band" },
];

export const getPattern = (id: string): PatternDef => {
  const p = PATTERNS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown pattern "${id}".`);
  return p;
};
