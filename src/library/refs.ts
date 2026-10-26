import type { ComponentRefs } from "./sync";

// Local components in "Leaf Public Sites Lib-test (Copy)" (file key kMEfNfi0711kmQrGbcPZkm),
// referenced by node ID, verified 2026-10-26. Tokens are harvested from the variables bound
// inside these components, so this list must cover every component whose tokens a template uses
// (promo-banner adds the spacing, radius, button and brand-strong tokens overview-cards lacks).
export const COMPONENT_REFS: ComponentRefs = {
  "overview-cards": { nodeId: "5048:69686" }, // set "Overview Card", 10 variants
  "promo-banner": { nodeId: "5053:3390" }, // set "Promo-Banner", 24 variants
  "text-media": { nodeId: "2462:35747" }, // set, 4 variants
  "two-col-form": { nodeId: "2611:83308" }, // set, 2 variants
  "accent-card": { nodeId: "2501:32472" }, // set, 4 variants
  "secondary-hero": { nodeId: "5710:6195" }, // set "Secondary Hero - Full Width", default 1440x420
  "highlight-band": { nodeId: "2520:45914" }, // set, page "Metrics band"
  "bullet-text": { nodeId: "2545:8954" }, // set "bullet text"
  "expanded-text": { nodeId: "2462:35759" }, // set "expanded text", default 4up, 1440 wide
};
