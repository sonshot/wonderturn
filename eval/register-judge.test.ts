import { describe, expect, it } from "vitest";

import { createRegisterJudgeSchema } from "./register-judge";

describe("register judge result boundary", () => {
  const criteria = ["plain-language", "focused"] as const;

  it("accepts exactly one verdict for every applicable criterion", () => {
    const result = createRegisterJudgeSchema(criteria).parse({
      verdicts: {
        focused: {
          pass: true,
          reason: "The answer stays on one idea.",
        },
        "plain-language": {
          pass: false,
          reason: "The answer uses unexplained jargon.",
        },
      },
    });

    expect(Object.keys(result.verdicts)).toHaveLength(2);
  });

  it("rejects a result that leaves an applicable criterion ungraded", () => {
    expect(() =>
      createRegisterJudgeSchema(criteria).parse({
        verdicts: {
          focused: {
            pass: true,
            reason: "The answer stays on one idea.",
          },
        },
      }),
    ).toThrow();
  });

  it("rejects verdicts for criteria that do not apply to the case", () => {
    expect(() =>
      createRegisterJudgeSchema(criteria).parse({
        verdicts: {
          focused: {
            pass: true,
            reason: "The answer stays on one idea.",
          },
          "plain-language": {
            pass: true,
            reason: "The answer uses simple words.",
          },
          "family-neutral": {
            pass: true,
            reason: "The answer takes no position.",
          },
        },
      }),
    ).toThrow();
  });
});
