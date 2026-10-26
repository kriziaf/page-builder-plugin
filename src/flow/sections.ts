import { PATTERNS, getPattern } from "./patterns";
import { getPageType } from "./pageTypes";

export type Section = { pattern: string; required: boolean; variant?: string };

export const recommended = (pageType: string): Section[] =>
  getPageType(pageType).sections.map((s) => ({ pattern: s.pattern, required: !!s.required }));

const requiredOf = (pageType: string) => getPageType(pageType).sections.filter((s) => s.required);

// Hero Primary is only offered on Business Page and Services.
const allowedOn = (pageType: string, pattern: string) =>
  pattern !== "hero-primary" || pageType === "business" || pageType === "services";

// Approved patterns not currently on the page.
export const addable = (pageType: string, sections: Section[]): string[] =>
  PATTERNS.map((p) => p.id).filter(
    (id) => allowedOn(pageType, id) && !sections.some((s) => s.pattern === id),
  );

export const addSection = (pageType: string, sections: Section[], pattern: string): Section[] => {
  if (!addable(pageType, sections).includes(pattern)) throw new Error(`"${pattern}" cannot be added.`);
  const required = requiredOf(pageType).some((s) => s.pattern === pattern);
  return [...sections, { pattern, required }];
};

export const removeSection = (sections: Section[], pattern: string): Section[] => {
  const s = sections.find((x) => x.pattern === pattern);
  if (s?.required) return sections; // required sections stay
  return sections.filter((x) => x.pattern !== pattern);
};

export const moveSection = (sections: Section[], pattern: string, dir: -1 | 1): Section[] => {
  const i = sections.findIndex((x) => x.pattern === pattern);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sections.length) return sections;
  const next = sections.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export type Brief = { audience: string; goal?: string; action?: string; pasted?: string };

export function validateGenerate(pageType: string, brief: Brief, sections: Section[]): void {
  if (!brief.audience?.trim()) throw new Error("Add an audience in the brief first.");
  if (!sections.length) throw new Error("Add at least one section.");
  for (const s of requiredOf(pageType)) {
    if (!sections.some((x) => x.pattern === s.pattern)) {
      throw new Error(`"${getPattern(s.pattern).label}" is required for this page type.`);
    }
  }
}
