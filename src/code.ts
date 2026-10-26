import { syncLibrary } from "./library/sync";
import { COMPONENT_REFS } from "./library/refs";
import { TEMPLATES, getTemplate } from "./templates";
import { pageIRToFigma } from "./ir/toFigma";
import { pageToHtml } from "./ir/toHtml";
import type { LibrarySnapshot } from "./ir/types";

// Runs inside "Leaf Public Sites Lib-test (Copy)" (file key kMEfNfi0711kmQrGbcPZkm).
// Components are local to that file and referenced by node ID; see src/library/refs.ts.

figma.showUI(__html__, { width: 420, height: 600 });

// Snapshot cached per session. Re-sync when the library changes.
let snapshot: LibrarySnapshot | null = null;

figma.ui.postMessage({ type: "templates", list: TEMPLATES.map((t) => ({ id: t.id, label: t.label, usesSeed: t.usesSeed })) });

figma.ui.onmessage = async (msg: { type: string; [k: string]: any }) => {
  try {
    if (msg.type === "sync") {
      snapshot = await syncLibrary(COMPONENT_REFS);
      figma.ui.postMessage({ type: "synced", tokens: Object.keys(snapshot.tokens).length });
    }

    if (msg.type === "generate") {
      if (!snapshot) throw new Error("Sync the library first.");
      const page = getTemplate(msg.template).build(msg.seed ?? { headline: "Headline", body: "Body", cta: "CTA" });
      const frame = await pageIRToFigma(page, snapshot);
      const html = pageToHtml(page, snapshot.tokens);
      figma.notify(`Updated "${frame.name}"`);
      figma.ui.postMessage({ type: "generated", html });
    }
  } catch (e) {
    figma.notify(`Error: ${(e as Error).message}`, { error: true });
    figma.ui.postMessage({ type: "error", message: (e as Error).message });
  }
};
