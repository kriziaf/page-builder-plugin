// A library the user can pick as the source of components and tokens. Components are imported
// by key into the open design file, so the library must be enabled there. Keys differ per
// library file; fill them by running capture inside the library file.
export type ProfileComponent = { key: string; isSet: boolean; name: string };

export type LibraryProfile = {
  id: string;
  name: string;
  sourceFile: string; // file name of the library itself; the plugin never generates into it
  components: Record<string, ProfileComponent>;
};
