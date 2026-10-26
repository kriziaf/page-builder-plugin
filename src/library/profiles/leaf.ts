import type { LibraryProfile } from "../profile";
import { COMPONENT_REFS } from "../refs";

// Keys are empty until captured: open "Leaf Public Sites Lib-test (Copy)", click Capture, and paste
// the printed components object over the one derived here.
export const leaf: LibraryProfile = {
  id: "leaf",
  name: "Leaf Public Sites",
  sourceFile: "Leaf Public Sites Lib-test (Copy)",
  components: Object.fromEntries(
    Object.entries(COMPONENT_REFS).map(([ref, r]) => [ref, { key: "", isSet: true, name: r.name }]),
  ),
};
