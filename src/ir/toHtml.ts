import type { IRNode, Layout, TokenRef, PageIR } from "./types";

// Token name "color.brand.primary" -> CSS variable "--color-brand-primary"
export const cssVar = (token: string) => `var(--${token.replace(/\./g, "-")})`;

const resolve = (v: TokenRef | number | undefined): string | undefined => {
  if (v === undefined) return undefined;
  if (typeof v === "number") return `${v}px`;
  return cssVar(v.token);
};

const layoutCss = (l: Layout): string => {
  const justify = { start: "flex-start", center: "center", end: "flex-end", between: "space-between" }[l.justify ?? "start"];
  const align = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" }[l.align ?? "stretch"];
  return [
    "display:flex",
    `flex-direction:${l.direction}`,
    `gap:${resolve(l.gap) ?? "0"}`,
    `padding:${resolve(l.padding) ?? "0"}`,
    `justify-content:${justify}`,
    `align-items:${align}`,
  ].join(";");
};

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export function nodeToHtml(node: IRNode): string {
  switch (node.kind) {
    case "frame": {
      const style = [
        layoutCss(node.layout),
        node.fill ? `background:${cssVar(node.fill.token)}` : "",
        node.radius !== undefined ? `border-radius:${resolve(node.radius)}` : "",
        node.width === "fill" ? "width:100%" : "",
      ].filter(Boolean).join(";");
      return `<div data-name="${escape(node.name)}" style="${style}">${node.children.map(nodeToHtml).join("")}</div>`;
    }
    case "text": {
      const color = node.color ? `color:${cssVar(node.color.token)}` : "";
      return `<span data-name="${escape(node.name)}" class="text-${node.style}" style="${color}">${escape(node.text)}</span>`;
    }
    case "instance": {
      // Instances render as their component's HTML template; the registry maps componentKey -> markup.
      return `<div data-component="${escape(node.name)}" data-key="${escape(node.componentKey)}"></div>`;
    }
  }
}

export function pageToHtml(page: PageIR, tokens: Record<string, string>): string {
  const vars = Object.entries(tokens).map(([k, v]) => `--${k.replace(/\./g, "-")}:${v};`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>:root{${vars}}body{margin:0;font-family:sans-serif}</style></head><body><div style="width:${page.width}px">${nodeToHtml(page.root)}</div></body></html>`;
}
