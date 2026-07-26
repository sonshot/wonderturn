import { isAllowedEmail } from "@/lib/auth/allowlist";
import { auth } from "@/lib/auth/server";
import { synthesizeSpeech } from "@/lib/turn/elevenlabs";
import { getFixedOutcomeAudio } from "@/lib/turn/fixed-audio";
import {
  handleTurnRequest,
  type TurnHandlerDependencies,
} from "@/lib/turn/handle-turn-request";
import { gatewayTextDependencies } from "@/lib/turn/gateway-adapters";

const dependencies: TurnHandlerDependencies = {
  authorize: async (headers) => {
    const session = await auth.api.getSession({ headers });

    return session !== null && isAllowedEmail(session.user.email);
  },
  getFixedAudio: getFixedOutcomeAudio,
  synthesizeSpeech,
  text: gatewayTextDependencies,
};

export async function POST(request: Request) {
  return handleTurnRequest(request, dependencies);
}
