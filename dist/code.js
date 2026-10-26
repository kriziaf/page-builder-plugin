"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/library/sync.ts
  var toHex = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
  var rgbToHex = (c) => `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
  var tokenName = (variableName) => variableName.replace(/\//g, ".");
  var pageOf = (node) => {
    let p = node;
    while (p && p.type !== "PAGE") p = p.parent;
    return p;
  };
  var isComponent = (n) => !!n && (n.type === "COMPONENT_SET" || n.type === "COMPONENT");
  var normalize = (name) => name.trim().toLowerCase();
  async function findComponentByName(name) {
    var _a;
    const wanted = normalize(name);
    let component = null;
    for (const page of figma.root.children) {
      await page.loadAsync();
      const matches = page.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] });
      for (const m of matches) {
        if (normalize(m.name) !== wanted) continue;
        if (m.type === "COMPONENT_SET") return m;
        if (((_a = m.parent) == null ? void 0 : _a.type) !== "COMPONENT_SET" && !component) component = m;
      }
    }
    return component;
  }
  async function resolveRef(ref) {
    const byId = await figma.getNodeByIdAsync(ref.nodeId);
    if (isComponent(byId)) return { node: byId, via: "id" };
    const byName = await findComponentByName(ref.name);
    return byName ? { node: byName, via: "name" } : null;
  }
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
  async function harvestTree(node, seen, tokens, variableIds) {
    const page = pageOf(node);
    if (page) await page.loadAsync();
    await harvest(node, seen, tokens, variableIds);
    for (const child of node.findAll(() => true)) {
      await harvest(child, seen, tokens, variableIds);
    }
  }
  async function syncProfile(profile) {
    const tokens = {};
    const variableIds = {};
    const components = {};
    const resolution = {};
    const seen = /* @__PURE__ */ new Set();
    const keyless = Object.entries(profile.components).filter(([, c]) => !c.key).map(([k]) => k);
    if (keyless.length) {
      throw new Error(
        `Library "${profile.name}" has no component keys for: ${keyless.join(", ")}. Run capture inside the library file and paste the output into its profile.`
      );
    }
    const failed = [];
    for (const [ref, c] of Object.entries(profile.components)) {
      try {
        const node = c.isSet ? await figma.importComponentSetByKeyAsync(c.key) : await figma.importComponentByKeyAsync(c.key);
        components[ref] = { nodeId: node.id, isSet: c.isSet };
        resolution[ref] = "key";
        await harvestTree(node, seen, tokens, variableIds);
      } catch (e) {
        failed.push(`${ref} ("${c.name}")`);
      }
    }
    if (failed.length) {
      throw new Error(
        `Could not import from "${profile.name}": ${failed.join(", ")}. Enable the library in this file (Assets > Libraries) and sync again.`
      );
    }
    return { source: profile.name, components, tokens, variableIds, resolution };
  }
  async function captureProfile(refs) {
    const out = {};
    for (const [ref, r] of Object.entries(refs)) {
      const found = await resolveRef(r);
      if (!found) throw new Error(`"${ref}" ("${r.name}") not found in "${figma.root.name}".`);
      out[ref] = { key: found.node.key, isSet: found.node.type === "COMPONENT_SET", name: found.node.name };
    }
    return out;
  }
  async function isLibraryFile(profile, refs) {
    if (figma.root.name === profile.sourceFile) return true;
    const names = Object.keys(profile.components).map((k) => {
      var _a, _b;
      return (_b = (_a = refs[k]) == null ? void 0 : _a.name) != null ? _b : profile.components[k].name;
    });
    if (!names.length) return false;
    for (const name of names) {
      if (!await findComponentByName(name)) return false;
    }
    return true;
  }

  // src/library/refs.ts
  var COMPONENT_REFS = {
    "overview-cards": { nodeId: "5048:69686", name: "Overview Card" },
    // set, 10 variants
    "promo-banner": { nodeId: "5053:3390", name: "Promo-Banner" },
    // set, 24 variants
    "text-media": { nodeId: "2462:35747", name: "Text and Media" },
    // set, 4 variants (name unverified)
    "two-col-form": { nodeId: "2611:83308", name: "Form" },
    // set, 2 variants (name unverified)
    "accent-card": { nodeId: "2501:32472", name: "Accent Cards" },
    // set, 4 variants (name unverified)
    "secondary-hero": { nodeId: "5710:6195", name: "Secondary Hero - Full Width" },
    // set, default 1440x420
    "expanded-text": { nodeId: "2462:35759", name: "expanded text" }
    // set, default 4up, 1440 wide
  };

  // src/library/profiles/leaf.ts
  var leaf = {
    id: "leaf",
    name: "Leaf Public Sites",
    sourceFile: "Leaf Public Sites Lib-test (Copy)",
    components: Object.fromEntries(
      Object.entries(COMPONENT_REFS).map(([ref, r]) => [ref, { key: "", isSet: true, name: r.name }])
    )
  };

  // src/library/registry.ts
  var PROFILES = [leaf];
  var DEFAULT_PROFILE_ID = "leaf";
  var getProfile = (id) => {
    const profile = PROFILES.find((p) => p.id === (id != null ? id : DEFAULT_PROFILE_ID));
    if (!profile) throw new Error(`Unknown library "${id}".`);
    return profile;
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
        if (!source) throw new Error(`Component node ${entry.nodeId} not found. Re-sync the library.`);
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
    figmaPage.name = `${page.name} (${(/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ")})`;
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

  // src/flow/pageTypes.ts
  var ARTICLE = [
    { pattern: "hero-secondary", required: true },
    { pattern: "longform-text", required: true },
    { pattern: "text-media" },
    { pattern: "horizontal-cards" },
    { pattern: "external-link-cards" },
    { pattern: "accent-cards", required: true }
  ];
  var PAGE_TYPES = [
    {
      id: "business",
      label: "Business Page",
      sections: [
        { pattern: "hero-primary", required: true },
        { pattern: "overview-cards" },
        { pattern: "text-media" },
        { pattern: "accent-cards", required: true },
        { pattern: "promo-banner" },
        { pattern: "two-col-form", required: true }
      ]
    },
    { id: "article", label: "Article", sections: ARTICLE },
    { id: "blog", label: "Blog", sections: ARTICLE },
    // same as Article until Blog sections are defined
    {
      id: "services",
      label: "Services",
      sections: [
        { pattern: "hero-primary", required: true },
        { pattern: "external-link-cards" },
        { pattern: "expanded-text" },
        { pattern: "text-media" },
        { pattern: "accent-cards" },
        { pattern: "promo-banner", required: true },
        { pattern: "two-col-form" }
      ]
    }
  ];
  var getPageType = (id) => {
    const t = PAGE_TYPES.find((x) => x.id === id);
    if (!t) throw new Error(`Unknown page type "${id}".`);
    return t;
  };

  // src/flow/patterns.ts
  var PATTERNS = [
    { id: "overview-cards", label: "Overview Cards", componentKey: "overview-cards" },
    { id: "accent-cards", label: "Accent Cards", componentKey: "accent-card" },
    { id: "graphic-cards", label: "Graphic Cards" },
    { id: "horizontal-cards", label: "Horizontal Cards" },
    { id: "external-link-cards", label: "External Link Cards" },
    { id: "bullet-image", label: "Bullet Image" },
    { id: "text-media", label: "Text Media", componentKey: "text-media" },
    { id: "expanded-text", label: "Expanded Text", componentKey: "expanded-text" },
    { id: "longform-text", label: "Longform Text" },
    { id: "hero-primary", label: "Hero Primary" },
    { id: "hero-secondary", label: "Hero Secondary", componentKey: "secondary-hero" },
    { id: "two-col-form", label: "Two-Col Form", componentKey: "two-col-form" },
    { id: "promo-banner", label: "Promo Banner Card", componentKey: "promo-banner" },
    { id: "highlight-band", label: "Highlight Band" }
  ];
  var getPattern = (id) => {
    const p = PATTERNS.find((x) => x.id === id);
    if (!p) throw new Error(`Unknown pattern "${id}".`);
    return p;
  };

  // src/flow/sections.ts
  var recommended = (pageType) => getPageType(pageType).sections.map((s) => ({ pattern: s.pattern, required: !!s.required }));
  var requiredOf = (pageType) => getPageType(pageType).sections.filter((s) => s.required);
  var allowedOn = (pageType, pattern) => pattern !== "hero-primary" || pageType === "business" || pageType === "services";
  var addable = (pageType, sections) => PATTERNS.map((p) => p.id).filter(
    (id) => allowedOn(pageType, id) && !sections.some((s) => s.pattern === id)
  );
  var addSection = (pageType, sections, pattern) => {
    if (!addable(pageType, sections).includes(pattern)) throw new Error(`"${pattern}" cannot be added.`);
    const required = requiredOf(pageType).some((s) => s.pattern === pattern);
    return [...sections, { pattern, required }];
  };
  var removeSection = (sections, pattern) => {
    const s = sections.find((x) => x.pattern === pattern);
    if (s == null ? void 0 : s.required) return sections;
    return sections.filter((x) => x.pattern !== pattern);
  };
  var moveSection = (sections, pattern, dir) => {
    const i = sections.findIndex((x) => x.pattern === pattern);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sections.length) return sections;
    const next = sections.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };
  function validateGenerate(pageType, brief, sections) {
    var _a;
    if (!((_a = brief.audience) == null ? void 0 : _a.trim())) throw new Error("Add an audience in the brief first.");
    if (!sections.length) throw new Error("Add at least one section.");
    for (const s of requiredOf(pageType)) {
      if (!sections.some((x) => x.pattern === s.pattern)) {
        throw new Error(`"${getPattern(s.pattern).label}" is required for this page type.`);
      }
    }
  }

  // src/flow/build.ts
  function buildFromSections(pageType, brief, sections, hasComponent) {
    const type = getPageType(pageType);
    const children = sections.map((s) => {
      const pattern = getPattern(s.pattern);
      if (pattern.componentKey && hasComponent(pattern.componentKey)) {
        const variants = pattern.variants && s.variant ? { [pattern.variants.prop]: s.variant } : void 0;
        return { kind: "instance", name: pattern.label, componentKey: pattern.componentKey, variants };
      }
      return {
        kind: "frame",
        name: `${pattern.label} (placeholder)`,
        layout: { direction: "column", gap: 0, padding: 40 },
        width: "fill",
        children: [
          { kind: "text", name: "Label", text: `${pattern.label}: no component in this library`, style: "heading", width: "fill" }
        ]
      };
    });
    const name = `${type.label} - ${brief.audience.trim()}`;
    const root = { kind: "frame", name, layout: { direction: "column", gap: 0, padding: 0 }, children };
    return { template: `flow-${type.id}`, name, width: 1440, root };
  }

  // src/code.ts
  figma.showUI(__html__, { width: 420, height: 640 });
  var snapshot = null;
  var snapshotLibrary = null;
  var buildPage = (msg) => {
    var _a;
    return msg.template === "enguide" ? templateEnGuide() : templateA((_a = msg.seed) != null ? _a : { headline: "Headline", body: "Body", cta: "CTA" });
  };
  figma.ui.onmessage = async (msg) => {
    try {
      if (msg.type === "init") {
        figma.ui.postMessage({
          type: "libraries",
          libraries: PROFILES.map((p) => ({ id: p.id, name: p.name })),
          defaultId: DEFAULT_PROFILE_ID,
          file: figma.root.name,
          isSource: PROFILES.some((p) => p.sourceFile === figma.root.name),
          pageTypes: PAGE_TYPES.map((t) => ({ id: t.id, label: t.label }))
        });
      }
      if (msg.type === "sections") {
        let list = msg.op === "reset" ? recommended(msg.pageType) : msg.sections;
        if (msg.op === "add") list = addSection(msg.pageType, list, msg.pattern);
        if (msg.op === "remove") list = removeSection(list, msg.pattern);
        if (msg.op === "move") list = moveSection(list, msg.pattern, msg.dir);
        figma.ui.postMessage({
          type: "sections",
          sections: list.map((x) => __spreadProps(__spreadValues({}, x), { label: getPattern(x.pattern).label })),
          addable: addable(msg.pageType, list).map((id) => ({ id, label: getPattern(id).label }))
        });
      }
      if (msg.type === "capture") {
        const profile = getProfile(msg.libraryId);
        const components = await captureProfile(COMPONENT_REFS);
        figma.ui.postMessage({ type: "captured", libraryId: profile.id, json: JSON.stringify(components, null, 2) });
      }
      if (msg.type === "sync") {
        const profile = getProfile(msg.libraryId);
        snapshot = await syncProfile(profile);
        snapshotLibrary = profile.id;
        figma.ui.postMessage({
          type: "synced",
          source: snapshot.source,
          tokens: Object.keys(snapshot.tokens).length,
          components: Object.keys(snapshot.components).length
        });
      }
      if (msg.type === "generate") {
        if (!snapshot || !snapshotLibrary) throw new Error("Sync the library first.");
        if (await isLibraryFile(getProfile(snapshotLibrary), COMPONENT_REFS)) {
          throw new Error(
            "This is a library file. Open your design file (or duplicate or branch this one in Figma) and run the plugin there."
          );
        }
        let page;
        if (msg.preset) {
          page = buildPage({ template: msg.preset, seed: msg.seed });
        } else {
          validateGenerate(msg.pageType, msg.brief, msg.sections);
          const snap = snapshot;
          page = buildFromSections(msg.pageType, msg.brief, msg.sections, (key) => key in snap.components);
        }
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
