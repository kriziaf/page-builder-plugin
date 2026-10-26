# Feature Specification: Guided page flow (v0.4.0)

**Feature Branch**: `claude/exciting-goldberg-jdclgz`
**Created**: 2026-10-26
**Status**: Implemented, not yet verified in Figma (see Status table)
**Input**: Start a page from a simple design brief inside the Figma plugin, after choosing which design library to use. Adapted from the Page Builder v0.1.1 spec (web prototype) with the SVG registry dropped: the plugin generates real library component instances.

## Scope

Tracks the plan approved on 2026-10-26. Related decisions already shipped: library as a selectable source,
one timestamped frame per run on a shared sandbox page. Update 2026-10-26: the default Leaf profile is `local` mode, which reads components from pages of the open file and generates there (no key import, no library guard); `keys` mode keeps import-by-key and the guard.

### Adapted from the web-prototype spec

| Prototype step | Decision |
| --- | --- |
| 1 Scope (Single / Multi-page) | Dropped. One live option is not a step. |
| 2 Page type | Kept, as a dropdown on the Brief screen. |
| 3 Brief | Kept, trimmed to page type, Audience, Goal, Primary action, optional pasted brief. |
| 4 Architecture + 5 Customize | Merged into one Sections screen. |
| 6 Generate (SVG mock, HTML export) | Generate to Figma. SVG registry dropped. HTML export optional. |
| (none) | New: Library screen first. |

## Flow

0. **Library**: dropdown of profiles (`src/library/registry.ts`, default Leaf). Shows enabled/captured state and gates Next on a successful sync. A single library with keys already synced is pre-selected, but the screen is still shown so the choice is explicit.
1. **Brief**: page type, Audience (required), Goal, Primary action, optional "paste a full brief" text area (stored, not parsed).
2. **Sections**: recommended list for the page type from the table below; required rows locked; add (only unused sections), remove, reorder (up/down buttons), variant picker.
3. **Generate**: summary of library, brief and structure, then Generate to Figma. Export HTML optional.

## Requirements

- **FR-001**: Offer exactly four page types: Business Page, Article, Blog, Services.
- **FR-002**: Each page type has a recommended section list; each section maps to one of the fourteen approved patterns.
- **FR-003**: Required sections cannot be removed.
- **FR-004**: Add section offers only patterns not on the page. Hero Primary is offered only on Business Page and Services.
- **FR-005**: Sections can be reordered and removed (optional ones). Changing page type resets the list.
- **FR-006**: Audience is required to leave the Brief screen. At least one section is required to leave Sections.
- **FR-007**: Entries survive Back/Forward navigation.
- **FR-008**: Generate builds a vertical stack of library instances in section order at 1440 wide, in the open file, as a new timestamped frame on the latest "Page Template Sandbox NN" page, placed to the right of earlier frames (nothing is replaced; a "Start new sandbox" checkbox starts the next number). In `keys` mode it refuses to run inside a library file; in `local` mode (Leaf default) it runs in the library test file.
- **FR-009**: A pattern with no component in the synced library renders as a labeled placeholder frame instead of failing.
- **FR-010**: The pasted brief is stored and shown to the user, not parsed into fields.
- **FR-011**: Existing templates (EnGuide, Starter) remain available as an "Advanced: preset".

### Recommended sections

**R** = required.

| # | Business Page | Article | Blog | Services |
|---|---|---|---|---|
| 1 | Hero Primary **R** | Hero Secondary **R** | Hero Secondary **R** | Hero Primary **R** |
| 2 | Overview Cards | Longform Text **R** | Longform Text **R** | External Link Cards |
| 3 | Text Media | Text Media | Text Media | Expanded Text |
| 4 | Accent Cards **R** | Horizontal Cards | Horizontal Cards | Text Media |
| 5 | Promo Banner Card | External Link Cards | External Link Cards | Accent Cards |
| 6 | Two-Col Form **R** | Accent Cards **R** | Accent Cards **R** | Promo Banner Card **R** |
| 7 | | | | Two-Col Form |

Blog uses Article's list until Blog sections are defined. Data lives in `src/flow/pageTypes.ts`.

### Pattern-to-component mapping (`src/flow/patterns.ts`)

Mapped to a library component: Overview Cards, Accent Cards, Text Media, Expanded Text, Hero Secondary,
Two-Col Form, Promo Banner Card. No component yet (placeholder): Hero Primary, Highlight Band, Longform Text,
Horizontal Cards, External Link Cards, Graphic Cards, Bullet Image.

## Status

| Item | State |
| --- | --- |
| Page types, recommended sections, required flags (FR-001..003) | Built, unit-tested |
| Add / remove / reorder rules (FR-004, 005) | Built, unit-tested |
| Gating and Back/Forward state (FR-006, 007) | Built; not exercised in Figma |
| Generate stack + placeholders + library guard (FR-008, 009) | Built; not run in Figma |
| Pasted brief stored (FR-010) | Built |
| Presets under Advanced (FR-011) | Built |
| Sandbox page, frames side by side, new-sandbox checkbox | Built, unit-tested helpers; not run in Figma |
| Library screen: enabled/captured state shown | **Not built.** Only sync success gates Next. |
| Section variant picker | **Not built.** Variant property names in the library are unverified. |
| Export HTML | **Not built.** The preview iframe shows the HTML; no download. |
| Leaf component keys | **Not needed for the default.** Leaf is `local` mode. Keys are only needed for `keys` mode. |
| Components for missing patterns | **Pending**, per library file. |

## Out of scope

SVG pattern registry, multi-page sets, Search Results, brief parsing into fields, content-length validation,
saved sessions, uploading custom assets.

## Success Criteria

- **SC-001**: For each page type, a user reaches a generated page in the design file without leaving the plugin.
- **SC-002**: Every page type shows a non-empty section list with required sections locked.
- **SC-003**: Generated frame order matches the Sections list; missing components appear as labeled placeholders.
- **SC-004**: In `keys` mode, Generate in a library file is refused with instructions; in `local` mode it generates a new page in the open file.
- **SC-005**: Going Back and forward keeps the brief, pasted text and section edits.

## Open Items

- Whether the web prototype (`src/app/patterns`) lives in another repository.
- Which of Hero Primary, Hero Secondary and Highlight Band exist in each library file.
- Variant property names per component set.
- Merge of commit `4e9f492` (template registry, services templates); see `CHANGELOG.md`.
