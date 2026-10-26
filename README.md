# Page Builder Plugin

A Figma plugin that generates sample pages using customizable templates with component-based architecture.

## Features

- **Template System**: Pre-built templates for quick page generation
  - Template A: Basic content template
  - En Guide: English guide template
- **Library Sync**: Syncs Figma components from a library for consistent design
- **Page Generation**: Creates fully-formed Figma pages from templates with optional custom data
- **HTML Export**: Generates HTML representation of created pages
- **Component References**: Type-safe references to library components

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. In Figma, go to **Plugins → Development → Import plugin from manifest** and select the `manifest.json` file

## Usage

1. Open the plugin UI in Figma
2. Click **Sync Library** to load components from the Leaf Public Sites library
3. Choose a template (Template A or En Guide)
4. Click **Generate Page** to create a new page
5. The generated page will appear in your Figma document, and HTML preview will be available in the plugin UI

## Project Structure

```
src/
├── code.ts              # Main plugin logic
├── harness.ts           # Testing utilities
├── ir/                  # Intermediate representation layer
│   ├── types.ts         # Type definitions
│   ├── toFigma.ts       # Convert IR to Figma nodes
│   └── toHtml.ts        # Convert IR to HTML
├── library/             # Component library management
│   ├── refs.ts          # Component references
│   ├── sync.ts          # Library sync logic
│   └── leaf-copy-nodes.json  # Reference data
└── templates/           # Page templates
    ├── templateA.ts
    └── templateEnGuide.ts
ui/
└── index.html           # Plugin UI
```

## Development

Run tests:
```bash
npm run test
```

Build for development:
```bash
npm run build
```

## Version

Current version: **0.1.0**

## License

Private

## Sources and targets

The library is a source; the plugin writes only into the design file you have open.

1. Enable the library in your design file (Assets > Libraries).
2. Open the plugin, pick the library, click **Sync library**, then **Generate page**.
3. The plugin refuses to generate inside a library file. Duplicate or branch the file in Figma and run it there.

### Adding a library

Library profiles live in `src/library/profiles/`. Component keys differ per library file, so for a new
library: open the library file, pick it in the dropdown, click **Capture keys**, and paste the output
as `components` in a new profile (register it in `src/library/registry.ts`). The Leaf profile ships
without keys and needs one capture run.

## Older versions

| Tag | Behavior |
| --- | --- |
| `v0.1.0` | Leaf test file only; writes pages into that file (simple tests) |
| `v0.1.1` | Runs in any file with the same components (name fallback) |
| `v0.2.0` | Separate template-system refactor (`4e9f492`), not in this branch |
| `v0.3.0` | Library as source; generates only in a design file |

`git fetch --tags && git checkout v0.1.0`. See `CHANGELOG.md`.
