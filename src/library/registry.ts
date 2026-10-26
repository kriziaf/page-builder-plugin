import type { LibraryProfile } from "./profile";
import { leaf } from "./profiles/leaf";

export const PROFILES: LibraryProfile[] = [leaf];
export const DEFAULT_PROFILE_ID = "leaf";

export const getProfile = (id: string | undefined): LibraryProfile => {
  const profile = PROFILES.find((p) => p.id === (id ?? DEFAULT_PROFILE_ID));
  if (!profile) throw new Error(`Unknown library "${id}".`);
  return profile;
};
