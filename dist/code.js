"use strict";
(() => {
  // src/library/sync.ts
  var toHex = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
  var rgbToHex = (c) => `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
  var tokenName = (variableName) => variableName.replace(/\//g, ".");
  var pageOf = (node) => {
    let p = node;
    while (p && p.type !== "PAGE") p = p.parent;
    return p;
  };
  async function harvest(node, seen, tokens, variableIds) {
    const bound = node.boundVariables;
    if (!bound) return;
    for (const prop of Object.keys(bound)) {
      const refs = Array.isArray(bound[prop]) ? bound[prop] : [bound[prop]];
      for (const ref of refs) {
        if (!ref || !ref.id || seen.has(ref.id)) continue;
        seen.add(ref.id);
        const v = await figma.variables.getVariableByIdAsync(ref.id);
        if (!v) continue;
        const resolved = v.resolveForConsumer(node).value;
        let value = null;
        if (v.resolvedType === "COLOR" && resolved && typeof resolved === "object" && "r" in resolved) {
          value = rgbToHex(resolved);
        } else if (v.resolvedType === "FLOAT" && typeof resolved === "number") {
          value = String(resolved);
        }
        if (value === null) continue;
        const name = tokenName(v.name);
        tokens[name] = value;
        variableIds[name] = v.id;
      }
    }
  }
  async function syncLibrary(refs) {
    const tokens = {};
    const variableIds = {};
    const components = {};
    const seen = /* @__PURE__ */ new Set();
    for (const [name, { nodeId }] of Object.entries(refs)) {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node || node.type !== "COMPONENT_SET" && node.type !== "COMPONENT") {
        throw new Error(`"${name}" (${nodeId}) not found. Run this plugin inside the Leaf copy file.`);
      }
      components[name] = { nodeId, isSet: node.type === "COMPONENT_SET" };
      const page = pageOf(node);
      if (page) await page.loadAsync();
      await harvest(node, seen, tokens, variableIds);
      for (const child of node.findAll(() => true)) {
        await harvest(child, seen, tokens, variableIds);
      }
    }
    return { source: "Leaf Public Sites Lib-test (Copy)", components, tokens, variableIds };
  }

  // src/library/refs.ts
  var COMPONENT_REFS = {
    "overview-cards": { nodeId: "5048:69686" },
    // set "Overview Card", 10 variants
    "promo-banner": { nodeId: "5053:3390" },
    // set "Promo-Banner", 24 variants
    "text-media": { nodeId: "2462:35747" },
    // set, 4 variants
    "two-col-form": { nodeId: "2611:83308" },
    // set, 2 variants
    "accent-card": { nodeId: "2501:32472" },
    // set, 4 variants
    "secondary-hero": { nodeId: "5710:6195" },
    // set "Secondary Hero - Full Width", default 1440x420
    "expanded-text": { nodeId: "2462:35759" }
    // set "expanded text", default 4up, 1440 wide
  };

  // src/templates/templateA.ts
  function templateA(seed) {
    return {
      template: "A",
      name: "Template A \u2014 Sample",
      width: 1440,
      root: {
        kind: "frame",
        name: "Page",
        layout: { direction: "column", gap: { token: "base.spacing.32" }, padding: { token: "base.spacing.40" } },
        fill: { token: "color.bg.default" },
        children: [
          {
            kind: "frame",
            name: "Hero",
            layout: { direction: "column", gap: { token: "base.spacing.16" }, padding: { token: "base.spacing.40" }, align: "start" },
            fill: { token: "color.bg.default" },
            radius: { token: "base.border-radius.24" },
            width: "fill",
            children: [
              { kind: "text", name: "Headline", text: seed.headline, style: "display", color: { token: "color.content.brand-strong" }, width: "fill" },
              { kind: "text", name: "Body", text: seed.body, style: "body", color: { token: "color.content.default" }, width: "fill" }
            ]
          },
          // Leaf "Overview Card" is a full section (component set, 10 variants). Default variant for now.
          { kind: "instance", name: "Overview Card", componentKey: "overview-cards" },
          {
            kind: "frame",
            name: "CTA Band",
            layout: { direction: "row", justify: "between", align: "center", padding: { token: "base.spacing.24" } },
            fill: { token: "color.bg.default" },
            radius: { token: "base.border-radius.16" },
            width: "fill",
            children: [
              { kind: "text", name: "CTA Label", text: seed.cta, style: "heading", color: { token: "color.content.brand-strong" } }
            ]
          }
        ]
      }
    };
  }

  // src/templates/templateEnGuide.ts
  function templateEnGuide() {
    return {
      template: "EnGuide",
      name: "EnGuide Pharmacy \u2014 Test",
      width: 1440,
      root: {
        kind: "frame",
        name: "EnGuide Pharmacy page",
        layout: { direction: "column", gap: 0, padding: 0 },
        fill: { token: "color.bg.default" },
        children: [
          {
            kind: "instance",
            name: "Hero",
            componentKey: "secondary-hero",
            texts: [
              "Support on your GLP-1 journey",
              "Held to the highest standards under the Evernorth\xAE brand, our team of specially trained pharmacists are readily available to address your needs and work directly with your doctor to help you save money, discuss treatment options, and more.",
              "Log in"
            ]
          },
          { kind: "instance", name: "Service overview", componentKey: "expanded-text" },
          {
            kind: "instance",
            name: "Feature overview",
            componentKey: "text-media",
            texts: [
              "Pharmacists available to you",
              "Our specially trained pharmacists work directly with your doctor to help you save money and discuss treatment options.",
              "Learn more"
            ]
          },
          { kind: "instance", name: "Supporting details", componentKey: "accent-card" },
          {
            kind: "instance",
            name: "Final CTA",
            componentKey: "promo-banner",
            texts: [
              "Get started with EnGuide Pharmacy",
              "Log in to manage your GLP-1 prescriptions, or explore the FAQs.",
              "Log in to account",
              "Explore FAQs"
            ]
          },
          { kind: "instance", name: "Inquiry form", componentKey: "two-col-form" }
        ]
      }
    };
  }

  // src/ir/toFigma.ts
  var TEXT_SIZES = {
    display: { size: 56, weight: "Bold" },
    heading: { size: 32, weight: "Bold" },
    body: { size: 16, weight: "Regular" },
    caption: { size: 12, weight: "Regular" },
    label: { size: 14, weight: "Medium" }
  };
  var hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255
    };
  };
  var requireToken = (token, snap) => {
    const value = snap.tokens[token];
    if (value === void 0) throw new Error(`Unknown token "${token}". It is not used by the synced components.`);
    return value;
  };
  var resolveNum = (v, snap) => {
    if (v === void 0) return 0;
    if (typeof v === "number") return v;
    return parseFloat(requireToken(v.token, snap));
  };
  var bindFill = async (node, ref, snap) => {
    const paint = { type: "SOLID", color: hexToRgb(requireToken(ref.token, snap)) };
    const variable = await figma.variables.getVariableByIdAsync(snap.variableIds[ref.token]);
    node.fills = [variable ? figma.variables.setBoundVariableForPaint(paint, "color", variable) : paint];
  };
  var bindNumber = async (node, fields, v, snap) => {
    if (v === void 0 || typeof v === "number") return;
    const variable = await figma.variables.getVariableByIdAsync(snap.variableIds[v.token]);
    if (!variable) return;
    for (const f of fields) node.setBoundVariable(f, variable);
  };
  var PADDING = ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"];
  var RADIUS = ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"];
  var applyLayout = async (frame, l, snap) => {
    var _a, _b;
    frame.layoutMode = l.direction === "row" ? "HORIZONTAL" : "VERTICAL";
    frame.itemSpacing = resolveNum(l.gap, snap);
    const p = resolveNum(l.padding, snap);
    frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = p;
    frame.primaryAxisAlignItems = { start: "MIN", center: "CENTER", end: "MAX", between: "SPACE_BETWEEN" }[(_a = l.justify) != null ? _a : "start"];
    frame.counterAxisAlignItems = { start: "MIN", center: "CENTER", end: "MAX", stretch: "MIN" }[(_b = l.align) != null ? _b : "stretch"];
    await bindNumber(frame, ["itemSpacing"], l.gap, snap);
    await bindNumber(frame, PADDING, l.padding, snap);
  };
  var isAutoLayout = (n) => n.type === "FRAME" && n.layoutMode !== "NONE";
  async function nodeToFigma(node, snap, parent) {
    switch (node.kind) {
      case "frame": {
        const f = figma.createFrame();
        f.name = node.name;
        await applyLayout(f, node.layout, snap);
        f.fills = [];
        if (node.fill) await bindFill(f, node.fill, snap);
        if (node.radius !== void 0) {
          f.cornerRadius = resolveNum(node.radius, snap);
          await bindNumber(f, RADIUS, node.radius, snap);
        }
        parent.appendChild(f);
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
        const component = source.type === "COMPONENT_SET" ? source.defaultVariant : source;
        const inst = component.createInstance();
        inst.name = node.name;
        if (node.variants) inst.setProperties(node.variants);
        parent.appendChild(inst);
        if (node.texts) {
          const layers = inst.findAllWithCriteria({ types: ["TEXT"] });
          for (let i = 0; i < node.texts.length && i < layers.length; i++) {
            const value = node.texts[i];
            if (value === void 0) continue;
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
  async function pageIRToFigma(page, snap) {
    const figmaPage = figma.createPage();
    figmaPage.name = page.name;
    await figma.setCurrentPageAsync(figmaPage);
    const root = await nodeToFigma(page.root, snap, figmaPage);
    if ("resize" in root) root.resize(page.width, root.height);
    return figmaPage;
  }

  // src/ir/toHtml.ts
  var cssVar = (token) => `var(--${token.replace(/\./g, "-")})`;
  var resolve = (v) => {
    if (v === void 0) return void 0;
    if (typeof v === "number") return `${v}px`;
    return cssVar(v.token);
  };
  var layoutCss = (l) => {
    var _a, _b, _c, _d;
    const justify = { start: "flex-start", center: "center", end: "flex-end", between: "space-between" }[(_a = l.justify) != null ? _a : "start"];
    const align = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" }[(_b = l.align) != null ? _b : "stretch"];
    return [
      "display:flex",
      `flex-direction:${l.direction}`,
      `gap:${(_c = resolve(l.gap)) != null ? _c : "0"}`,
      `padding:${(_d = resolve(l.padding)) != null ? _d : "0"}`,
      `justify-content:${justify}`,
      `align-items:${align}`
    ].join(";");
  };
  var escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function nodeToHtml(node) {
    switch (node.kind) {
      case "frame": {
        const style = [
          layoutCss(node.layout),
          node.fill ? `background:${cssVar(node.fill.token)}` : "",
          node.radius !== void 0 ? `border-radius:${resolve(node.radius)}` : "",
          node.width === "fill" ? "width:100%" : ""
        ].filter(Boolean).join(";");
        return `<div data-name="${escape(node.name)}" style="${style}">${node.children.map(nodeToHtml).join("")}</div>`;
      }
      case "text": {
        const color = node.color ? `color:${cssVar(node.color.token)}` : "";
        return `<span data-name="${escape(node.name)}" class="text-${node.style}" style="${color}">${escape(node.text)}</span>`;
      }
      case "instance": {
        return `<div data-component="${escape(node.name)}" data-key="${escape(node.componentKey)}"></div>`;
      }
    }
  }
  function pageToHtml(page, tokens) {
    const vars = Object.entries(tokens).map(([k, v]) => `--${k.replace(/\./g, "-")}:${v};`).join("");
    return `<!doctype html><html><head><meta charset="utf-8"><style>:root{${vars}}body{margin:0;font-family:sans-serif}</style></head><body><div style="width:${page.width}px">${nodeToHtml(page.root)}</div></body></html>`;
  }

  // src/code.ts
  figma.showUI(__html__, { width: 420, height: 600 });
  var snapshot = null;
  var buildPage = (msg) => {
    var _a;
    return msg.template === "enguide" ? templateEnGuide() : templateA((_a = msg.seed) != null ? _a : { headline: "Headline", body: "Body", cta: "CTA" });
  };
  figma.ui.onmessage = async (msg) => {
    try {
      if (msg.type === "sync") {
        snapshot = await syncLibrary(COMPONENT_REFS);
        figma.ui.postMessage({ type: "synced", tokens: Object.keys(snapshot.tokens).length });
      }
      if (msg.type === "generate") {
        if (!snapshot) throw new Error("Sync the library first.");
        const page = buildPage(msg);
        const figmaPage = await pageIRToFigma(page, snapshot);
        const html = pageToHtml(page, snapshot.tokens);
        figma.notify(`Created page "${figmaPage.name}"`);
        figma.ui.postMessage({ type: "generated", html });
      }
    } catch (e) {
      figma.notify(`Error: ${e.message}`, { error: true });
      figma.ui.postMessage({ type: "error", message: e.message });
    }
  };
})();
