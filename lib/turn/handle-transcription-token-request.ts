import { turnFailureSchema } from "./contracts";
import { transcriptionTokenSchema } from "./transcription-contracts";

const ENDPOINT = "/api/transcriptions/token";

type FailureCategory = "authorization" | "upstream";

type FailureMetadata = {
  category: FailureCategory;
  endpoint: typeof ENDPOINT;
  status: number;
};

export type TranscriptionTokenHandlerDependencies = {
  authorize: (headers: Headers) => Promise<boolean>;
  logFailure?: (metadata: FailureMetadata) => void;
  mintToken: () => Promise<string>;
};

function failureResponse(
  category: FailureCategory,
  status: number,
  logFailure: TranscriptionTokenHandlerDependencies["logFailure"],
) {
  const metadata: FailureMetadata = { category, endpoint: ENDPOINT, status };
  (
    logFailure ??
    ((value) => console.error("[transcription] token request failed", value))
  )(metadata);

  return Response.json(turnFailureSchema.parse({ category }), { status });
}

export async function handleTranscriptionTokenRequest(
  request: Request,
  dependencies: TranscriptionTokenHandlerDependencies,
) {
  try {
    if (!(await dependencies.authorize(request.headers))) {
      return failureResponse("authorization", 401, dependencies.logFailure);
    }
  } catch {
    return failureResponse("upstream", 502, dependencies.logFailure);
  }

  try {
    return Response.json(
      transcriptionTokenSchema.parse({
        token: await dependencies.mintToken(),
      }),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return failureResponse("upstream", 502, dependencies.logFailure);
  }
}
