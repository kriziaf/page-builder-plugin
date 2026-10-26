// A library the user can pick as the source of components and tokens.
// mode "local": components are read from pages of the open file (reference node IDs, then name),
//   so the file itself carries the library, e.g. the Leaf test copy.
// mode "keys": components are imported by key into a design file that has the library enabled.
//   Keys differ per library file; fill them by running capture inside the library file.
export type ProfileComponent = { key: string; isSet: boolean; name: string };

export type LibraryProfile = {
  id: string;
  mode: "local" | "keys";
  name: string;
  sourceFile: string; // file name of the library itself; the plugin never generates into it
  components: Record<string, ProfileComponent>;
};
