// Recommended sections per page type (spec "Recommended Sections"). required = cannot be removed.
export type PageTypeId = "business" | "article" | "blog" | "services";
export type SectionSpec = { pattern: string; required?: boolean };

const ARTICLE: SectionSpec[] = [
  { pattern: "hero-secondary", required: true },
  { pattern: "longform-text", required: true },
  { pattern: "text-media" },
  { pattern: "horizontal-cards" },
  { pattern: "external-link-cards" },
  { pattern: "accent-cards", required: true },
];

export const PAGE_TYPES: { id: PageTypeId; label: string; sections: SectionSpec[] }[] = [
  {
    id: "business",
    label: "Business Page",
    sections: [
      { pattern: "hero-primary", required: true },
      { pattern: "overview-cards" },
      { pattern: "text-media" },
      { pattern: "accent-cards", required: true },
      { pattern: "promo-banner" },
      { pattern: "two-col-form", required: true },
    ],
  },
  { id: "article", label: "Article", sections: ARTICLE },
  { id: "blog", label: "Blog", sections: ARTICLE }, // same as Article until Blog sections are defined
  {
    id: "services",
    label: "Services",
    sections: [
      { pattern: "hero-primary", required: true },
      { pattern: "external-link-cards" },
      { pattern: "expanded-text" },
      { pattern: "text-media" },
      { pattern: "accent-cards" },
      { pattern: "promo-banner", required: true },
      { pattern: "two-col-form" },
    ],
  },
];

export const getPageType = (id: string) => {
  const t = PAGE_TYPES.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown page type "${id}".`);
  return t;
};
