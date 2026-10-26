import type { FrameNode, IRNode, PageIR } from "../ir/types";
import { getPageType } from "./pageTypes";
import { getPattern } from "./patterns";
import type { Brief, Section } from "./sections";

// Builds a vertical stack of library instances, one per section, at desktop width.
// A section whose pattern has no component in the synced library becomes a labeled placeholder.
export function buildFromSections(
  pageType: string,
  brief: Brief,
  sections: Section[],
  hasComponent: (componentKey: string) => boolean,
): PageIR {
  const type = getPageType(pageType);
  const children: IRNode[] = sections.map((s) => {
    const pattern = getPattern(s.pattern);
    if (pattern.componentKey && hasComponent(pattern.componentKey)) {
      const variants = pattern.variants && s.variant ? { [pattern.variants.prop]: s.variant } : undefined;
      return { kind: "instance", name: pattern.label, componentKey: pattern.componentKey, variants };
    }
    return {
      kind: "frame",
      name: `${pattern.label} (placeholder)`,
      layout: { direction: "column", gap: 0, padding: 40 },
      width: "fill",
      children: [
        { kind: "text", name: "Label", text: `${pattern.label}: no component in this library`, style: "heading", width: "fill" },
      ],
    };
  });
  const name = `${type.label} - ${brief.audience.trim()}`;
  const root: FrameNode = { kind: "frame", name, layout: { direction: "column", gap: 0, padding: 0 }, children };
  return { template: `flow-${type.id}`, name, width: 1440, root };
}
