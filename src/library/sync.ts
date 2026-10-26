import type { LibrarySnapshot, TokenMap } from "../ir/types";

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
export type Resolution = "id" | "name";
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

    const page = pageOf(node);
    if (page) await page.loadAsync(); // dynamic-page access: load before traversing
    await harvest(node, seen, tokens, variableIds);
    for (const child of node.findAll(() => true)) {
      await harvest(child, seen, tokens, variableIds);
    }
  }

  if (missing.length) {
    throw new Error(
      `Components not found in "${figma.root.name}": ${missing.join(", ")}. ` +
        "Open the Leaf test file or a library file with the same components.",
    );
  }

  return { source: figma.root.name, components, tokens, variableIds, resolution };
}
