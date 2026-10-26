import type { PageIR } from "../ir/types";

// EnGuide workflow: the Page Wizard's "Services" page template filled with the Evernorth
// EnGuide Pharmacy brief (reference repo: src/app/App.tsx, GENERATED_HERO_COPY and the sample
// brief). Mirrors the example page "01 — Virtual Care Overview": a vertical stack of library
// instances at 1440px, no gaps. Six sections:
//   hero -> service overview -> feature overview -> supporting details -> final CTA -> inquiry form
// Copy is overridden only where the text layers are known (hero, text-media, promo banner).
// expanded-text, accent-card and two-col-form keep the component's placeholder copy for now.
export function templateEnGuide(): PageIR {
  return {
    template: "EnGuide",
    name: "EnGuide Pharmacy — Test",
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
            "Held to the highest standards under the Evernorth® brand, our team of specially trained pharmacists are readily available to address your needs and work directly with your doctor to help you save money, discuss treatment options, and more.",
            "Log in",
          ],
        },
        { kind: "instance", name: "Service overview", componentKey: "expanded-text" },
        {
          kind: "instance",
          name: "Feature overview",
          componentKey: "text-media",
          texts: [
            "Pharmacists available to you",
            "Our specially trained pharmacists work directly with your doctor to help you save money and discuss treatment options.",
            "Learn more",
          ],
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
            "Explore FAQs",
          ],
        },
        { kind: "instance", name: "Inquiry form", componentKey: "two-col-form" },
      ],
    },
  };
}
