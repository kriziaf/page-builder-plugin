import { captureProfile, isLibraryFile, syncLibrary, syncProfile } from "./library/sync";
import { DEFAULT_PROFILE_ID, getProfile, PROFILES } from "./library/registry";
import { COMPONENT_REFS } from "./library/refs";
import { templateA } from "./templates/templateA";
import { templateEnGuide } from "./templates/templateEnGuide";
import { pageIRToFigma } from "./ir/toFigma";
import { pageToHtml } from "./ir/toHtml";
import { PAGE_TYPES } from "./flow/pageTypes";
import { getPattern } from "./flow/patterns";
import { addSection, addable, moveSection, recommended, removeSection, validateGenerate } from "./flow/sections";
import type { Section } from "./flow/sections";
import { buildFromSections } from "./flow/build";
import type { LibrarySnapshot, PageIR } from "./ir/types";

// The library is a selectable source. "local" profiles (default: Leaf) read components from pages of the
// open file; "keys" profiles import by key into a design file and never generate inside a library file.

figma.showUI(__html__, { width: 420, height: 640 });

// Snapshot cached per session, with the library it came from. Re-sync when the library changes.
let snapshot: LibrarySnapshot | null = null;
let snapshotLibrary: string | null = null;

const buildPage = (msg: { [k: string]: any }): PageIR =>
  msg.template === "enguide"
    ? templateEnGuide()
    : templateA(msg.seed ?? { headline: "Headline", body: "Body", cta: "CTA" });

figma.ui.onmessage = async (msg: { type: string; [k: string]: any }) => {
  try {
    if (msg.type === "init") {
      figma.ui.postMessage({
        type: "libraries",
        libraries: PROFILES.map((p) => ({ id: p.id, name: p.name })),
        defaultId: DEFAULT_PROFILE_ID,
        file: figma.root.name,
        isSource: PROFILES.some((p) => p.sourceFile === figma.root.name),
        pageTypes: PAGE_TYPES.map((t) => ({ id: t.id, label: t.label })),
      });
    }

    if (msg.type === "sections") {
      let list: Section[] = msg.op === "reset" ? recommended(msg.pageType) : msg.sections;
      if (msg.op === "add") list = addSection(msg.pageType, list, msg.pattern);
      if (msg.op === "remove") list = removeSection(list, msg.pattern);
      if (msg.op === "move") list = moveSection(list, msg.pattern, msg.dir);
      figma.ui.postMessage({
        type: "sections",
        sections: list.map((x) => ({ ...x, label: getPattern(x.pattern).label })),
        addable: addable(msg.pageType, list).map((id) => ({ id, label: getPattern(id).label })),
      });
    }

    if (msg.type === "capture") {
      const profile = getProfile(msg.libraryId);
      const components = await captureProfile(COMPONENT_REFS);
      figma.ui.postMessage({ type: "captured", libraryId: profile.id, json: JSON.stringify(components, null, 2) });
    }

    if (msg.type === "sync") {
      const profile = getProfile(msg.libraryId);
      snapshot = profile.mode === "local" ? await syncLibrary(COMPONENT_REFS) : await syncProfile(profile);
      snapshotLibrary = profile.id;
      figma.ui.postMessage({
        type: "synced",
        source: snapshot.source,
        tokens: Object.keys(snapshot.tokens).length,
        components: Object.keys(snapshot.components).length,
      });
    }

    if (msg.type === "generate") {
      if (!snapshot || !snapshotLibrary) throw new Error("Sync the library first.");
      const active = getProfile(snapshotLibrary);
      // Local mode works inside the library file itself (it only adds a new timestamped page).
      if (active.mode === "keys" && (await isLibraryFile(active, COMPONENT_REFS))) {
        throw new Error(
          "This is a library file. Open your design file (or duplicate or branch this one in Figma) and run the plugin there.",
        );
      }
      let page: PageIR;
      if (msg.preset) {
        page = buildPage({ template: msg.preset, seed: msg.seed });
      } else {
        validateGenerate(msg.pageType, msg.brief, msg.sections);
        const snap = snapshot;
        page = buildFromSections(msg.pageType, msg.brief, msg.sections, (key) => key in snap.components);
      }
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
