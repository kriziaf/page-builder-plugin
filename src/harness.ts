// Test harness: bundles the plugin's real sync + build code so it can run through
// use_figma in the Leaf copy file, where figma.showUI is not available.
import { syncLibrary } from "./library/sync";
import { COMPONENT_REFS } from "./library/refs";
import { pageIRToFigma } from "./ir/toFigma";
import { templateEnGuide } from "./templates/templateEnGuide";

export const sync = () => syncLibrary(COMPONENT_REFS);
export const buildEnGuide = (snap: Awaited<ReturnType<typeof sync>>) => pageIRToFigma(templateEnGuide(), snap);
