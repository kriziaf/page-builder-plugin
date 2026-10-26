import { describe, expect, it } from "vitest";
import { nextX, parseSandbox, pickSandbox, sandboxName } from "./sandbox";

describe("sandbox naming", () => {
  it("zero-pads and parses names", () => {
    expect(sandboxName(1)).toBe("Page Template Sandbox 01");
    expect(parseSandbox("Page Template Sandbox 03")).toBe(3);
    expect(parseSandbox("Page 1")).toBeNull();
    expect(parseSandbox("Page Template Sandbox 03 copy")).toBeNull();
  });

  it("picks the right sandbox", () => {
    expect(pickSandbox(["Page 1"], false)).toEqual({ name: "Page Template Sandbox 01", create: true });
    expect(pickSandbox(["Page Template Sandbox 01"], false)).toEqual({ name: "Page Template Sandbox 01", create: false });
    expect(pickSandbox(["Page Template Sandbox 01", "Page Template Sandbox 03"], false).name).toBe("Page Template Sandbox 03");
    expect(pickSandbox(["Page Template Sandbox 01", "Page Template Sandbox 03"], true)).toEqual({
      name: "Page Template Sandbox 04",
      create: true,
    });
  });
});

describe("nextX", () => {
  it("starts at 0 and places frames to the right with a gap", () => {
    expect(nextX([])).toBe(0);
    expect(nextX([{ x: 0, width: 1440 }])).toBe(1640);
    expect(nextX([{ x: 0, width: 1440 }, { x: 1640, width: 1440 }], 100)).toBe(3180);
  });
});
