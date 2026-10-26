import { syncLibrary } from "./library/sync";
import { COMPONENT_REFS } from "./library/refs";
import { templateA } from "./templates/templateA";
import { templateEnGuide } from "./templates/templateEnGuide";
import { pageIRToFigma } from "./ir/toFigma";
import { pageToHtml } from "./ir/toHtml";
import type { LibrarySnapshot, PageIR } from "./ir/types";

// Runs inside the open library file. "Leaf Public Sites Lib-test (Copy)" (file key kMEfNfi0711kmQrGbcPZkm)
// is the reference: its node IDs are tried first, then components are found by name; see src/library/refs.ts.

figma.showUI(__html__, { width: 420, height: 600 });

// Snapshot cached per session. Re-sync when the library changes.
let snapshot: LibrarySnapshot | null = null;

const buildPage = (msg: { [k: string]: any }): PageIR =>
  msg.template === "enguide"
    ? templateEnGuide()
    : templateA(msg.seed ?? { headline: "Headline", body: "Body", cta: "CTA" });

figma.ui.onmessage = async (msg: { type: string; [k: string]: any }) => {
  try {
    if (msg.type === "sync") {
      snapshot = await syncLibrary(COMPONENT_REFS);
      const byName = Object.keys(snapshot.resolution).filter((k) => snapshot!.resolution[k] === "name");
      figma.ui.postMessage({
        type: "synced",
        source: snapshot.source,
        tokens: Object.keys(snapshot.tokens).length,
        components: Object.keys(snapshot.components).length,
        byName,
      });
    }

    if (msg.type === "generate") {
      if (!snapshot) throw new Error("Sync the library first.");
      const page = buildPage(msg);
      const figmaPage = await pageIRToFigma(page, snapshot);
      const html = pageToHtml(page, snapshot.tokens);
      figma.notify(`Created page "${figmaPage.name}"`);
      figma.ui.postMessage({ type: "generated", html });
    }
  } catch (e) {
    figma.notify(`Error: ${(e as Error).message}`, { error: true });
    figma.ui.postMessage({ type: "error", message: (e as Error).message });
  }
};
