import { describe, expect, it } from "vitest";

import { gatewayTextDependencies } from "../lib/turn/gateway-adapters";
import { runTextTurn } from "../lib/turn/run-text-turn";
import { OUTCOME_FIXTURES } from "./fixtures";

const LIVE_CASE_TIMEOUT_MS = 30_000;

describe.sequential("production model-backed outcome fixtures", () => {
  it.each(OUTCOME_FIXTURES)(
    "$group: $label",
    async ({ candidateOverride, expected, history, said }) => {
      const outcome = await runTextTurn(
        { history: history ?? [], said },
        gatewayTextDependencies,
        { candidateOverride },
      );

      expect(outcome.kind).toBe(expected);
    },
    LIVE_CASE_TIMEOUT_MS,
  );
});
