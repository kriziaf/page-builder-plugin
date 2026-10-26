import type { IRNode, Layout, TokenRef, PageIR, LibrarySnapshot } from "./types";

// Runs inside the Figma plugin sandbox. Depends only on the `figma` global.
// Colors, spacing and radii bind to the file's variables. An unknown token throws,
// so a template that drifts from the library fails loudly instead of rendering wrong.

const TEXT_SIZES: Record<string, { size: number; weight: string }> = {
  display: { size: 56, weight: "Bold" },
  heading: { size: 32, weight: "Bold" },
  body: { size: 16, weight: "Regular" },
  caption: { size: 12, weight: "Regular" },
  label: { size: 14, weight: "Medium" },
};

export const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
};

const requireToken = (token: string, snap: LibrarySnapshot): string => {
  const value = snap.tokens[token];
  if (value === undefined) throw new Error(`Unknown token "${token}". It is not used by the synced components.`);
  return value;
};

const resolveNum = (v: TokenRef | number | undefined, snap: LibrarySnapshot): number => {
  if (v === undefined) return 0;
  if (typeof v === "number") return v;
  return parseFloat(requireToken(v.token, snap));
};

const bindFill = async (node: SceneNode & GeometryMixin, ref: TokenRef, snap: LibrarySnapshot) => {
  const paint: SolidPaint = { type: "SOLID", color: hexToRgb(requireToken(ref.token, snap)) };
  const variable = await figma.variables.getVariableByIdAsync(snap.variableIds[ref.token]);
  node.fills = [variable ? figma.variables.setBoundVariableForPaint(paint, "color", variable) : paint];
};

const bindNumber = async (
  node: SceneNode,
  fields: string[],
  v: TokenRef | number | undefined,
  snap: LibrarySnapshot,
) => {
  if (v === undefined || typeof v === "number") return;
  const variable = await figma.variables.getVariableByIdAsync(snap.variableIds[v.token]);
  if (!variable) return;
  for (const f of fields) (node as any).setBoundVariable(f, variable);
};

const PADDING = ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"];
const RADIUS = ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"];

const applyLayout = async (frame: FrameNode, l: Layout, snap: LibrarySnapshot) => {
  frame.layoutMode = l.direction === "row" ? "HORIZONTAL" : "VERTICAL";
  frame.itemSpacing = resolveNum(l.gap, snap);
  const p = resolveNum(l.padding, snap);
  frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = p;
  frame.primaryAxisAlignItems = ({ start: "MIN", center: "CENTER", end: "MAX", between: "SPACE_BETWEEN" } as const)[l.justify ?? "start"];
  frame.counterAxisAlignItems = ({ start: "MIN", center: "CENTER", end: "MAX", stretch: "MIN" } as const)[l.align ?? "stretch"];
  await bindNumber(frame, ["itemSpacing"], l.gap, snap);
  await bindNumber(frame, PADDING, l.padding, snap);
};

const isAutoLayout = (n: BaseNode): n is FrameNode => n.type === "FRAME" && n.layoutMode !== "NONE";

export async function nodeToFigma(node: IRNode, snap: LibrarySnapshot, parent: FrameNode | PageNode): Promise<SceneNode> {
  switch (node.kind) {
    case "frame": {
      const f = figma.createFrame();
      f.name = node.name;
      await applyLayout(f, node.layout, snap);
      f.fills = [];
      if (node.fill) await bindFill(f, node.fill, snap);
      if (node.radius !== undefined) {
        f.cornerRadius = resolveNum(node.radius, snap);
        await bindNumber(f, RADIUS, node.radius, snap);
      }
      parent.appendChild(f);
      // FILL is only valid on a child of an auto-layout frame, after it is appended.
      if (node.width === "fill" && isAutoLayout(parent)) f.layoutSizingHorizontal = "FILL";
      for (const child of node.children) await nodeToFigma(child, snap, f);
      return f;
    }
    case "text": {
      const style = TEXT_SIZES[node.style];
      await figma.loadFontAsync({ family: "Inter", style: style.weight });
      const t = figma.createText();
      t.fontName = { family: "Inter", style: style.weight };
      t.fontSize = style.size;
      t.characters = node.text;
      t.name = node.name;
      if (node.color) await bindFill(t, node.color, snap);
      parent.appendChild(t);
      if (node.width === "fill" && isAutoLayout(parent)) {
        t.textAutoResize = "HEIGHT";
        t.layoutSizingHorizontal = "FILL";
      }
      return t;
    }
    case "instance": {
      const entry = snap.components[node.componentKey];
      if (!entry) throw new Error(`Component not in synced list: ${node.componentKey}`);
      const source = await figma.getNodeByIdAsync(entry.nodeId);
      if (!source) throw new Error(`Component node ${entry.nodeId} not found. Run inside the Leaf copy file.`);
      // A component set instantiates its default variant unless variants are given.
      const component =
        source.type === "COMPONENT_SET" ? source.defaultVariant : (source as ComponentNode);
      const inst = component.createInstance();
      inst.name = node.name;
      if (node.variants) inst.setProperties(node.variants);
      // Keep the variant's own width: Leaf sections are designed at fixed breakpoints (1440 / 375).
      parent.appendChild(inst);
      if (node.texts) {
        const layers = inst.findAllWithCriteria({ types: ["TEXT"] });
        for (let i = 0; i < node.texts.length && i < layers.length; i++) {
          const value = node.texts[i];
          if (value === undefined) continue;
          // Load the layer's current fonts before writing (it may not be Inter).
          for (const seg of layers[i].getStyledTextSegments(["fontName"])) {
            await figma.loadFontAsync(seg.fontName);
          }
          layers[i].characters = value;
        }
      }
      return inst;
    }
  }
}

export async function pageIRToFigma(page: PageIR, snap: LibrarySnapshot): Promise<PageNode> {
  const figmaPage = figma.createPage();
  figmaPage.name = page.name;
  await figma.setCurrentPageAsync(figmaPage);
  const root = await nodeToFigma(page.root, snap, figmaPage);
  if ("resize" in root) root.resize(page.width, root.height);
  return figmaPage;
}
