import { describe, expect, it } from "vitest";

import { normalizeAndBoundReply } from "./reply-text";

describe("normalizeAndBoundReply", () => {
  it("strips observed markdown without changing the spoken words", () => {
    expect(
      normalizeAndBoundReply(
        "**Magma** is melted rock. Read [more about it](https://example.com).",
      ),
    ).toBe("Magma is melted rock. Read more about it.");
  });

  it("keeps no more than three complete sentences", () => {
    expect(normalizeAndBoundReply("One. Two! Three? Four.")).toBe(
      "One. Two! Three?",
    );
  });

  it("drops an incomplete trailing fragment", () => {
    expect(
      normalizeAndBoundReply(
        "Stars look small because they are far away. Their light then",
      ),
    ).toBe("Stars look small because they are far away.");
  });

  it("stops before a sentence that would cross sixty words", () => {
    const first = `${Array.from({ length: 40 }, () => "one").join(" ")}.`;
    const second = `${Array.from({ length: 21 }, () => "Two").join(" ")}.`;

    expect(normalizeAndBoundReply(`${first} ${second}`)).toBe(first);
  });

  it("fails when no complete sentence can be cleared", () => {
    expect(() => normalizeAndBoundReply("A reply cut off halfway")).toThrow(
      "no complete sentence",
    );
  });
});
