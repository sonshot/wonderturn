import { describe, it } from "vitest";

import { gatewayTextDependencies } from "../lib/turn/gateway-adapters";
import { runTextTurn } from "../lib/turn/run-text-turn";
import { REGISTER_CASES } from "./register-cases";

const REGISTER_TIMEOUT_MS = 180_000;

function countWords(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

describe("current production register", () => {
  it(
    "prints the fixed asks for operator review without grading prose",
    async () => {
      for (const [index, entry] of REGISTER_CASES.entries()) {
        const outcome = await runTextTurn(
          { history: entry.history ?? [], said: entry.prompt },
          gatewayTextDependencies,
        );
        const endsWithQuestion = /\?\s*$/.test(outcome.text);

        console.log(
          [
            "",
            `${index + 1}. [${entry.tag}] ${entry.prompt}`,
            `   kind=${outcome.kind} words=${countWords(outcome.text)} ends-with-question=${endsWithQuestion ? "yes" : "no"}`,
            `   ${outcome.text}`,
          ].join("\n"),
        );
      }
    },
    REGISTER_TIMEOUT_MS,
  );
});
