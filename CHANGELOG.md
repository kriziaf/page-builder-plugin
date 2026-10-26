# Changelog

Older versions stay reachable as git tags: `git fetch --tags && git checkout <tag>`.
`dist/` is committed, so every tag can be loaded in Figma without a build.

## Unreleased
Leaf profile is `local` mode again: components come from pages of the open file (reference node ID, then
name) instead of import by key. `keys` mode and the library-file guard stay for libraries enabled in a
design file. Guided flow added (`specs/001-guided-flow`).

## v0.3.0
Library is a selectable source (profiles, import by key, capture mode). Generate runs only in the
open design file and refuses to run inside a library file. Generated pages get a time stamp.

## v0.2.0
Separate line of work (template system refactor, commit `4e9f492`). Not part of this branch's history.

## v0.1.1
Components resolve by reference node ID, then by name, so the plugin runs in any file that carries
the same components as the Leaf test file.

## v0.1.0
Leaf test file only: components by node ID, pages written into the same file. Use this tag for simple
tests inside the Leaf copy.
