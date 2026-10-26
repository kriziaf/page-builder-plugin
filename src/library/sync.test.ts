import { afterEach, describe, expect, it } from "vitest";
import { resolveRef } from "./sync";

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
