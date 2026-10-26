import { build } from "esbuild";
import { mkdirSync, copyFileSync } from "node:fs";

mkdirSync("dist", { recursive: true });

await build({
  entryPoints: ["src/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  target: "es2017",
  format: "iife",
});

// The UI is inlined into the plugin at build time via __html__ in Figma; copy it for manifest.ui.
copyFileSync("ui/index.html", "dist/ui.html");
console.log("Built dist/code.js and dist/ui.html");
