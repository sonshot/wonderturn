import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const customPropertyPattern =
  /`(--(?:color|font|radius|spacing|text)-[a-z0-9-]+)`/g;
const declarationPattern =
  /^\s*(--(?:color|font|radius|spacing|text)-[a-z0-9-]+):/gm;

function matches(source: string, pattern: RegExp) {
  return new Set(Array.from(source.matchAll(pattern), (match) => match[1]));
}

describe("design theme", () => {
  it("declares every theme custom property cited by DESIGN.md", () => {
    const root = process.cwd();
    const design = readFileSync(join(root, "DESIGN.md"), "utf8");
    const theme = readFileSync(join(root, "app/globals.css"), "utf8");
    const themeBlock = /@theme\s*\{([\s\S]*?)\n\}/.exec(theme)?.[1] ?? "";
    const citations = matches(design, customPropertyPattern);
    const declarations = matches(themeBlock, declarationPattern);

    expect(themeBlock).not.toBe("");
    expect(citations.size).toBeGreaterThan(0);
    expect([...citations].filter((token) => !declarations.has(token))).toEqual(
      [],
    );
  });
});
