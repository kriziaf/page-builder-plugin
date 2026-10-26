// Layout IR: the single source for both HTML output and Figma node output.
// Nodes reference design tokens by name, never by raw value.

export type TokenRef = { token: string }; // e.g. { token: "color.brand.primary" }

export type Layout = {
  direction: "row" | "column";
  gap?: TokenRef | number;
  padding?: TokenRef | number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
};

export type FrameNode = {
  kind: "frame";
  name: string;
  layout: Layout;
  fill?: TokenRef;
  radius?: TokenRef | number;
  width?: "fill" | "hug" | number;
  children: IRNode[];
};

export type TextNode = {
  kind: "text";
  name: string;
  text: string;
  style: "display" | "heading" | "body" | "caption" | "label";
  color?: TokenRef;
  width?: "fill" | "hug" | number;
};

export type InstanceNode = {
  kind: "instance";
  name: string;
  componentKey: string; // key from the published library snapshot
  variants?: Record<string, string>;
  // Replacement copy for the instance's text layers, in layer order (undefined keeps the default).
  texts?: (string | undefined)[];
};

export type IRNode = FrameNode | TextNode | InstanceNode;

export type PageIR = {
  template: string;
  name: string;
  width: number; // e.g. 1440 for desktop
  root: FrameNode;
};

export type TokenMap = Record<string, string>; // token name -> resolved value (hex, px)

export type LibrarySnapshot = {
  source: string;
  // Components of the open library file, as resolved at sync time (node IDs valid only in that file).
  components: Record<string, { nodeId: string; isSet: boolean }>;
  tokens: TokenMap; // token name ("base.spacing.24") -> resolved value (hex or number as string)
  variableIds: Record<string, string>; // token name -> Figma variable id
  resolution: Record<string, "id" | "name">; // how each component was found: reference node ID or by name
};
