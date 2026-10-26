// Test harness: bundles the plugin's real sync + build code so it can run through
// use_figma in the Leaf copy file, where figma.showUI is not available.
import { syncLibrary } from "./library/sync";
import { COMPONENT_REFS } from "./library/refs";
import { pageIRToFigma } from "./ir/toFigma";
import { getTemplate } from "./templates";

export const sync = () => syncLibrary(COMPONENT_REFS);
export const build = (id: string, snap: Awaited<ReturnType<typeof sync>>) => pageIRToFigma(getTemplate(id).build({ headline: "Headline", body: "Body", cta: "CTA" }), snap);
