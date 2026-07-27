import { gateway } from "@ai-sdk/gateway";

import { isAllowedEmail } from "@/lib/auth/allowlist";
import { auth } from "@/lib/auth/server";
import { handleTranscriptionTokenRequest } from "@/lib/turn/handle-transcription-token-request";
import { TRANSCRIPTION_MODEL } from "@/lib/turn/transcription-contracts";

export async function POST(request: Request) {
  return handleTranscriptionTokenRequest(request, {
    authorize: async (headers) => {
      const session = await auth.api.getSession({ headers });

      return session !== null && isAllowedEmail(session.user.email);
    },
    mintToken: async () => {
      const result = await gateway.experimental_transcription.getToken({
        expiresAfterSeconds: 60,
        model: TRANSCRIPTION_MODEL,
      });

      return result.token;
    },
  });
}
