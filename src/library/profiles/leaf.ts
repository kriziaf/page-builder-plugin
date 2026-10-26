import type { LibraryProfile } from "../profile";
import { COMPONENT_REFS } from "../refs";

// Local mode: components come from the open Leaf test file. Keys are only needed for "keys" mode;
// they are empty until captured: open "Leaf Public Sites Lib-test (Copy)", click Capture, and paste
// the printed components object over the one derived here.
export const leaf: LibraryProfile = {
  id: "leaf",
  mode: "local",
  name: "Leaf Public Sites",
  sourceFile: "Leaf Public Sites Lib-test (Copy)",
  components: Object.fromEntries(
    Object.entries(COMPONENT_REFS).map(([ref, r]) => [ref, { key: "", isSet: true, name: r.name }]),
  ),
};
