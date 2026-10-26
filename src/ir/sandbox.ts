// Generated frames collect on one "Page Template Sandbox NN" page instead of one page per run.
const PREFIX = "Page Template Sandbox";

export const sandboxName = (n: number) => `${PREFIX} ${String(n).padStart(2, "0")}`;

export const parseSandbox = (name: string): number | null => {
  const m = new RegExp(`^${PREFIX} (\\d+)$`).exec(name);
  return m ? parseInt(m[1], 10) : null;
};

// Latest sandbox (highest number), the next number when startNew, or 01 when none exist.
export function pickSandbox(pageNames: string[], startNew: boolean): { name: string; create: boolean } {
  const nums = pageNames.map(parseSandbox).filter((n): n is number => n !== null);
  if (!nums.length) return { name: sandboxName(1), create: true };
  const latest = Math.max(...nums);
  return startNew ? { name: sandboxName(latest + 1), create: true } : { name: sandboxName(latest), create: false };
}

// Left edge for the next frame: right of the rightmost existing frame, or 0 on an empty page.
export const nextX = (frames: { x: number; width: number }[], gap = 200): number =>
  frames.length ? Math.max(...frames.map((f) => f.x + f.width)) + gap : 0;
