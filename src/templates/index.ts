import type { PageIR } from "../ir/types";
import { templateA } from "./templateA";
import { templateEnGuide } from "./templateEnGuide";
import { servicesA, servicesB, servicesC, servicesD } from "./services";

export type Seed = { headline: string; body: string; cta: string };
export interface TemplateDef {
  id: string;
  label: string; // shown in the plugin dropdown
  usesSeed: boolean; // true if the headline/body/CTA fields apply
  build: (seed: Seed) => PageIR;
}

// To add a template: create src/templates/<file>.ts exporting a PageIR builder, then add one entry here.
export const TEMPLATES: TemplateDef[] = [
  { id: "services-a", label: "Services template - A (Virtual Care Overview)", usesSeed: false, build: () => servicesA() },
  { id: "services-b", label: "Services template - B (Urgent Care & Walk-ins)", usesSeed: false, build: () => servicesB() },
  { id: "services-c", label: "Services template - C (Mental Health & Therapy)", usesSeed: false, build: () => servicesC() },
  { id: "services-d", label: "Services template - D (Primary Care at Home)", usesSeed: false, build: () => servicesD() },
  { id: "enguide", label: "EnGuide Pharmacy demo (6 sections, custom copy)", usesSeed: false, build: () => templateEnGuide() },
  { id: "starter", label: "Starter (hero, cards, CTA)", usesSeed: true, build: (s) => templateA(s) },
];

export const getTemplate = (id: string) => {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown template "${id}".`);
  return t;
};
