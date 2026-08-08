import { describe, expect, it } from "vitest";

import { gatewayTextDependencies } from "../lib/turn/gateway-adapters";
import { runTextTurn } from "../lib/turn/run-text-turn";
import { REGISTER_CASES, REGISTER_CRITERIA } from "./register-cases";
import { judgeRegisterResponse } from "./register-judge";

const REGISTER_CASE_TIMEOUT_MS = 30_000;
const REGISTER_TIMEOUT_MS = 300_000;

function countWords(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

describe("current production register", () => {
  it(
    "passes routing and every applicable LLM-judged criterion",
    async () => {
      const failures: string[] = [];
      for (const entry of REGISTER_CASES) {
        if (entry.deferredReason !== undefined) {
          console.log(
            `\n${entry.id} [${entry.tag}] SKIPPED: ${entry.deferredReason}`,
          );
          continue;
        }

        const outcome = await runTextTurn(
          { history: entry.history ?? [], said: entry.prompt },
          gatewayTextDependencies,
          { signal: AbortSignal.timeout(REGISTER_CASE_TIMEOUT_MS) },
        );
        const endsWithQuestion = /\?\s*$/.test(outcome.text);
        const routingPass = outcome.kind === entry.expectedKind;
        const judgment = await judgeRegisterResponse(
          entry,
          outcome.text,
          AbortSignal.timeout(REGISTER_CASE_TIMEOUT_MS),
        );

        if (!routingPass) {
          failures.push(
            `${entry.id} routing: expected ${entry.expectedKind}, received ${outcome.kind}`,
          );
        }

        for (const criterion of entry.rubric) {
          const verdict = judgment.verdicts[criterion];

          if (verdict?.pass !== true) {
            failures.push(
              `${entry.id} ${criterion}: ${verdict?.reason ?? "missing verdict"}`,
            );
          }
        }

        console.log(
          [
            "",
            `${entry.id} [${entry.tag}] ${entry.prompt}`,
            `   kind=${outcome.kind} expected=${entry.expectedKind} routing=${routingPass ? "PASS" : "FAIL"}`,
            `   words=${countWords(outcome.text)} ends-with-question=${endsWithQuestion ? "yes" : "no"}`,
            `   ${outcome.text}`,
            "   LLM judge:",
            ...entry.rubric.map((criterion) => {
              const verdict = judgment.verdicts[criterion];

              return `   - ${verdict?.pass === true ? "PASS" : "FAIL"} ${criterion}: ${REGISTER_CRITERIA[criterion]} (${verdict?.reason ?? "missing verdict"})`;
            }),
          ].join("\n"),
        );
      }

      expect(failures, failures.join("\n")).toEqual([]);
    },
    REGISTER_TIMEOUT_MS,
  );
});
