import { z } from "zod";

import {
  turnFailureSchema,
  turnRequestSchema,
  turnResponseSchema,
} from "./contracts";
import type { FixedOutcomeKind } from "./fixed-responses";
import { runTextTurn, type TextTurnDependencies } from "./run-text-turn";

const ENDPOINT = "/api/turn";

type FailureCategory = "authorization" | "upstream" | "validation";

type FailureMetadata = {
  category: FailureCategory;
  endpoint: typeof ENDPOINT;
  status: number;
};

export type TurnHandlerDependencies = {
  authorize: (headers: Headers) => Promise<boolean>;
  getFixedAudio: (kind: FixedOutcomeKind) => string;
  logFailure?: (metadata: FailureMetadata) => void;
  synthesizeSpeech: (text: string, signal: AbortSignal) => Promise<string>;
  text: TextTurnDependencies;
};

function failureResponse(
  category: FailureCategory,
  status: number,
  logFailure: TurnHandlerDependencies["logFailure"],
) {
  const metadata: FailureMetadata = { category, endpoint: ENDPOINT, status };
  (logFailure ?? ((value) => console.error("[turn] request failed", value)))(
    metadata,
  );

  return Response.json(turnFailureSchema.parse({ category }), { status });
}

export async function handleTurnRequest(
  request: Request,
  dependencies: TurnHandlerDependencies,
) {
  try {
    if (!(await dependencies.authorize(request.headers))) {
      return failureResponse("authorization", 401, dependencies.logFailure);
    }
  } catch {
    return failureResponse("upstream", 502, dependencies.logFailure);
  }

  let input: z.infer<typeof turnRequestSchema>;

  try {
    input = turnRequestSchema.parse(await request.json());
  } catch {
    return failureResponse("validation", 400, dependencies.logFailure);
  }

  try {
    const outcome = await runTextTurn(input, dependencies.text, {
      prepareCandidate: dependencies.synthesizeSpeech,
      signal: request.signal,
    });
    const audio =
      outcome.kind === "reply"
        ? outcome.audio
        : dependencies.getFixedAudio(outcome.kind);

    return Response.json(
      turnResponseSchema.parse({
        audio,
        kind: outcome.kind,
        text: outcome.text,
      }),
    );
  } catch {
    return failureResponse("upstream", 502, dependencies.logFailure);
  }
}
