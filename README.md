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
