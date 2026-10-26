import { afterEach, describe, expect, it } from "vitest";
import { isLibraryFile, resolveRef, syncProfile } from "./sync";
import type { LibraryProfile } from "./profile";

type Fake = { id: string; name: string; type: string; parent?: { type: string } };

const mockFigma = (nodes: Fake[], byId: Record<string, Fake>) => {
  (globalThis as any).figma = {
    getNodeByIdAsync: async (id: string) => byId[id] ?? null,
    root: {
      children: [{ loadAsync: async () => {}, findAllWithCriteria: () => nodes }],
    },
  };
};

afterEach(() => delete (globalThis as any).figma);

const ref = { nodeId: "1:1", name: "Overview Card" };

describe("resolveRef", () => {
  it("uses the reference node ID when it exists", async () => {
    const node = { id: "1:1", name: "x", type: "COMPONENT_SET" };
    mockFigma([], { "1:1": node });
    expect(await resolveRef(ref)).toEqual({ node, via: "id" });
  });

  it("falls back to the component set name when the ID is missing", async () => {
    const node = { id: "9:9", name: "overview card", type: "COMPONENT_SET" };
    mockFigma([node], {});
    expect(await resolveRef(ref)).toEqual({ node, via: "name" });
  });

  it("ignores variants inside a set and non-component nodes at the ID", async () => {
    const variant = { id: "9:8", name: "Overview Card", type: "COMPONENT", parent: { type: "COMPONENT_SET" } };
    mockFigma([variant], { "1:1": { id: "1:1", name: "Overview Card", type: "FRAME" } });
    expect(await resolveRef(ref)).toBeNull();
  });
});

const profile = (key: string): LibraryProfile => ({
  id: "t",
  name: "Test Lib",
  sourceFile: "Test Lib Source",
  components: { card: { key, isSet: true, name: "Overview Card" } },
});

describe("syncProfile", () => {
  it("asks for a capture when keys are missing", async () => {
    await expect(syncProfile(profile(""))).rejects.toThrow(/Run capture/);
  });

  it("explains how to enable the library when the import fails", async () => {
    (globalThis as any).figma = {
      importComponentSetByKeyAsync: async () => {
        throw new Error("nope");
      },
    };
    await expect(syncProfile(profile("abc"))).rejects.toThrow(/Enable the library/);
  });

  it("imports by key and snapshots the imported node", async () => {
    (globalThis as any).figma = {
      importComponentSetByKeyAsync: async () => ({ id: "I1", type: "COMPONENT_SET", parent: null, findAll: () => [] }),
    };
    const snap = await syncProfile(profile("abc"));
    expect(snap.components.card).toEqual({ nodeId: "I1", isSet: true });
    expect(snap.resolution.card).toBe("key");
  });
});

describe("isLibraryFile", () => {
  const refs = { card: { nodeId: "1:1", name: "Overview Card" } };

  it("is true when the file name is the profile source", async () => {
    (globalThis as any).figma = { root: { name: "Test Lib Source", children: [] } };
    expect(await isLibraryFile(profile("k"), refs)).toBe(true);
  });

  it("is true when every component exists locally", async () => {
    mockFigma([{ id: "2:2", name: "Overview Card", type: "COMPONENT_SET" }], {});
    (globalThis as any).figma.root.name = "Copy of Lib";
    expect(await isLibraryFile(profile("k"), refs)).toBe(true);
  });

  it("is false in a design file without the local components", async () => {
    mockFigma([], {});
    (globalThis as any).figma.root.name = "My design";
    expect(await isLibraryFile(profile("k"), refs)).toBe(false);
  });
});
