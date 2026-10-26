import type { LibrarySnapshot, TokenMap } from "../ir/types";
import type { LibraryProfile } from "./profile";

// Runs in the plugin sandbox, inside whichever library file is open. The Leaf Public Sites
// copy is the reference file: its node IDs are tried first. In any other file with the same
// components (different file, different node IDs) refs fall back to a lookup by component name.
//
// Why not the team-library API: the copy has no libraries enabled, and
// figma.teamLibrary returns nothing there. The components' color, spacing and
// radius variables are remote, but they are still readable through the nodes
// that use them. So tokens are harvested from the variables bound inside the
// referenced components, and components are referenced by local node ID.

export type ComponentRef = { nodeId: string; name: string };
export type Resolution = "id" | "name" | "key";
export type ComponentRefs = Record<string, ComponentRef>;

const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
export const rgbToHex = (c: RGB | RGBA) => `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;

// "base/spacing/24" -> "base.spacing.24"
export const tokenName = (variableName: string) => variableName.replace(/\//g, ".");

const pageOf = (node: BaseNode): PageNode | null => {
  let p: BaseNode | null = node;
  while (p && p.type !== "PAGE") p = p.parent;
  return p as PageNode | null;
};

const isComponent = (n: BaseNode | null): n is ComponentNode | ComponentSetNode =>
  !!n && (n.type === "COMPONENT_SET" || n.type === "COMPONENT");

const normalize = (name: string) => name.trim().toLowerCase();

// Finds a top-level component or set by name in the open file. Loads pages lazily (dynamic-page access).
export async function findComponentByName(name: string): Promise<ComponentNode | ComponentSetNode | null> {
  const wanted = normalize(name);
  let component: ComponentNode | null = null;
  for (const page of figma.root.children) {
    await page.loadAsync();
    const matches = page.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] });
    for (const m of matches) {
      if (normalize(m.name) !== wanted) continue;
      if (m.type === "COMPONENT_SET") return m;
      // A variant inside a set is named "prop=value"; only standalone components count.
      if (m.parent?.type !== "COMPONENT_SET" && !component) component = m;
    }
  }
  return component;
}

export async function resolveRef(ref: ComponentRef): Promise<{ node: ComponentNode | ComponentSetNode; via: Resolution } | null> {
  const byId = await figma.getNodeByIdAsync(ref.nodeId);
  if (isComponent(byId)) return { node: byId, via: "id" };
  const byName = await findComponentByName(ref.name);
  return byName ? { node: byName, via: "name" } : null;
}

async function harvest(
  node: SceneNode,
  seen: Set<string>,
  tokens: TokenMap,
  variableIds: Record<string, string>,
) {
  const bound = (node as any).boundVariables as Record<string, any> | undefined;
  if (!bound) return;
  for (const prop of Object.keys(bound)) {
    const refs = Array.isArray(bound[prop]) ? bound[prop] : [bound[prop]];
    for (const ref of refs) {
      if (!ref || !ref.id || seen.has(ref.id)) continue;
      seen.add(ref.id);
      const v = await figma.variables.getVariableByIdAsync(ref.id);
      if (!v) continue;
      const resolved = v.resolveForConsumer(node).value;
      let value: string | null = null;
      if (v.resolvedType === "COLOR" && resolved && typeof resolved === "object" && "r" in resolved) {
        value = rgbToHex(resolved as RGB);
      } else if (v.resolvedType === "FLOAT" && typeof resolved === "number") {
        value = String(resolved);
      }
      if (value === null) continue; // fonts and strings are not used by the templates yet
      const name = tokenName(v.name);
      tokens[name] = value;
      variableIds[name] = v.id;
    }
  }
}

async function harvestTree(node: ComponentNode | ComponentSetNode, seen: Set<string>, tokens: TokenMap, variableIds: Record<string, string>) {
  const page = pageOf(node);
  if (page) await page.loadAsync(); // dynamic-page access: load before traversing
  await harvest(node, seen, tokens, variableIds);
  for (const child of node.findAll(() => true)) {
    await harvest(child, seen, tokens, variableIds);
  }
}

// Source-file path: resolves refs in the open file (by ID, then name). Used by capture mode.
export async function syncLibrary(refs: ComponentRefs): Promise<LibrarySnapshot> {
  const tokens: TokenMap = {};
  const variableIds: Record<string, string> = {};
  const components: LibrarySnapshot["components"] = {};
  const resolution: Record<string, Resolution> = {};
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const [key, ref] of Object.entries(refs)) {
    const found = await resolveRef(ref);
    if (!found) {
      missing.push(`${key} ("${ref.name}")`);
      continue;
    }
    const { node, via } = found;
    components[key] = { nodeId: node.id, isSet: node.type === "COMPONENT_SET" };
    resolution[key] = via;
    await harvestTree(node, seen, tokens, variableIds);
  }

  if (missing.length) {
    throw new Error(
      `Components not found in "${figma.root.name}": ${missing.join(", ")}. ` +
        "Open the Leaf test file or a library file with the same components.",
    );
  }

  return { source: figma.root.name, components, tokens, variableIds, resolution };
}

// Target-file path: imports the profile's components by key from the library enabled in this file.
export async function syncProfile(profile: LibraryProfile): Promise<LibrarySnapshot> {
  const tokens: TokenMap = {};
  const variableIds: Record<string, string> = {};
  const components: LibrarySnapshot["components"] = {};
  const resolution: Record<string, Resolution> = {};
  const seen = new Set<string>();

  const keyless = Object.entries(profile.components).filter(([, c]) => !c.key).map(([k]) => k);
  if (keyless.length) {
    throw new Error(
      `Library "${profile.name}" has no component keys for: ${keyless.join(", ")}. ` +
        "Run capture inside the library file and paste the output into its profile.",
    );
  }

  const failed: string[] = [];
  for (const [ref, c] of Object.entries(profile.components)) {
    try {
      const node = c.isSet
        ? await figma.importComponentSetByKeyAsync(c.key)
        : await figma.importComponentByKeyAsync(c.key);
      components[ref] = { nodeId: node.id, isSet: c.isSet };
      resolution[ref] = "key";
      await harvestTree(node, seen, tokens, variableIds);
    } catch {
      failed.push(`${ref} ("${c.name}")`);
    }
  }

  if (failed.length) {
    throw new Error(
      `Could not import from "${profile.name}": ${failed.join(", ")}. ` +
        "Enable the library in this file (Assets > Libraries) and sync again.",
    );
  }

  return { source: profile.name, components, tokens, variableIds, resolution };
}

// Capture mode, run inside a library file: the data a LibraryProfile needs.
export async function captureProfile(refs: ComponentRefs): Promise<LibraryProfile["components"]> {
  const out: LibraryProfile["components"] = {};
  for (const [ref, r] of Object.entries(refs)) {
    const found = await resolveRef(r);
    if (!found) throw new Error(`"${ref}" ("${r.name}") not found in "${figma.root.name}".`);
    out[ref] = { key: found.node.key, isSet: found.node.type === "COMPONENT_SET", name: found.node.name };
  }
  return out;
}

// True when the open file holds every profile component as a local node, i.e. it is a library
// (source) file. Generating here would write into the library, so the plugin refuses.
export async function isLibraryFile(profile: LibraryProfile, refs: ComponentRefs): Promise<boolean> {
  if (figma.root.name === profile.sourceFile) return true;
  const names = Object.keys(profile.components).map((k) => refs[k]?.name ?? profile.components[k].name);
  if (!names.length) return false;
  for (const name of names) {
    if (!(await findComponentByName(name))) return false;
  }
  return true;
}
