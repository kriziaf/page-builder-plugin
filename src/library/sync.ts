import type { LibrarySnapshot, TokenMap } from "../ir/types";

// Runs in the plugin sandbox, inside the Leaf Public Sites copy file.
//
// Why not the team-library API: the copy has no libraries enabled, and
// figma.teamLibrary returns nothing there. The components' color, spacing and
// radius variables are remote, but they are still readable through the nodes
// that use them. So tokens are harvested from the variables bound inside the
// referenced components, and components are referenced by local node ID.

export type ComponentRef = { nodeId: string };
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
  const seen = new Set<string>();

  for (const [name, { nodeId }] of Object.entries(refs)) {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || (node.type !== "COMPONENT_SET" && node.type !== "COMPONENT")) {
      throw new Error(`"${name}" (${nodeId}) not found. Run this plugin inside the Leaf copy file.`);
    }
    components[name] = { nodeId, isSet: node.type === "COMPONENT_SET" };

    const page = pageOf(node);
    if (page) await page.loadAsync(); // dynamic-page access: load before traversing
    await harvest(node, seen, tokens, variableIds);
    for (const child of node.findAll(() => true)) {
      await harvest(child, seen, tokens, variableIds);
    }
  }

  return { source: "Leaf Public Sites Lib-test (Copy)", components, tokens, variableIds };
}
