import type { ComponentRefs } from "./sync";

// Components of "Leaf Public Sites Lib-test (Copy)" (file key kMEfNfi0711kmQrGbcPZkm), the reference
// library. nodeId is tried first (valid only in that file); name is the fallback for other files that
// carry the same components. Tokens are harvested from the variables bound inside these components,
// so this list must cover every component whose tokens a template uses (promo-banner adds the
// spacing, radius, button and brand-strong tokens overview-cards lacks).
// Node IDs verified 2026-10-26. Names marked (unverified) are taken from the Leaf page names and
// need checking against the component set names in the file.
export const COMPONENT_REFS: ComponentRefs = {
  "overview-cards": { nodeId: "5048:69686", name: "Overview Card" }, // set, 10 variants
  "promo-banner": { nodeId: "5053:3390", name: "Promo-Banner" }, // set, 24 variants
  "text-media": { nodeId: "2462:35747", name: "Text and Media" }, // set, 4 variants (name unverified)
  "two-col-form": { nodeId: "2611:83308", name: "Form" }, // set, 2 variants (name unverified)
  "accent-card": { nodeId: "2501:32472", name: "Accent Cards" }, // set, 4 variants (name unverified)
  "secondary-hero": { nodeId: "5710:6195", name: "Secondary Hero - Full Width" }, // set, default 1440x420
  "expanded-text": { nodeId: "2462:35759", name: "expanded text" }, // set, default 4up, 1440 wide
};
