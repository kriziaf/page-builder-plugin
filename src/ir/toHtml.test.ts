import { describe, it, expect } from "vitest";
import { pageToHtml, cssVar } from "./toHtml";
import { templateA } from "../templates/templateA";

describe("toHtml", () => {
  it("maps dotted token names to CSS variables", () => {
    expect(cssVar("color.brand.primary")).toBe("var(--color-brand-primary)");
  });

  it("renders template A with token references, not raw colors", () => {
    const page = templateA({ headline: "H", body: "B", cta: "C" });
    const html = pageToHtml(page, { "color.bg.default": "#005a9c" });
    expect(html).toContain("var(--color-bg-default)");
    // The hex appears once, in the :root token block only; the body uses variables.
    const body = html.slice(html.indexOf("<body>"));
    expect(body).not.toContain("#005a9c");
    expect(html).toContain('data-name="Hero"');
  });

  it("escapes text content", () => {
    const page = templateA({ headline: "<script>x</script>", body: "", cta: "" });
    expect(pageToHtml(page, {})).not.toContain("<script>x</script>");
  });
});
