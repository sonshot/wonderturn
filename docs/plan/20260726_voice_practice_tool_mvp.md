# Voice Practice Tool MVP — Implementation Plan

Feature doc: [`docs/feat/20260725_voice_practice_tool_mvp.md`](../feat/20260725_voice_practice_tool_mvp.md)

## Status

Draft. Not started. No code in the repository yet.

Phase 0 is a throwaway spike whose result can invalidate the stack below;
nothing after it should be built until it passes.

## Scope

This plan owns *how* the MVP gets built and verified. The feature doc owns
what it is and why; scope, fences, and acceptance outcomes are not repeated
here. Where this plan pins a semantic the feature doc left open, it says so
under Pinned semantics.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router), TypeScript |
| Host | Vercel |
| Speech in | Web Speech API, on device — no provider, no upload |
| Models | Vercel AI Gateway via AI SDK |
| Reply | Claude Sonnet 5 |
| Disclosure + clearing checks | Claude Haiku 4.5 |
| Speech out | OpenAI TTS via AI Gateway (beta audio lane) |
| Auth | Google sign-in, verified once; signed httpOnly cookie thereafter |
| Storage | None — no database, no client persistence |
| Validation | Zod |
| Spend ceiling | AI Gateway budget (provider-native, not app code) |
| Tests | Vitest; register suite as an LLM-judge harness |

The app is stateless. The client holds the conversation in memory and sends
it with each turn; nothing persists anywhere, which is the no-storage stance
expressed in the wire format rather than merely promised.

## Prerequisites and external gates

| | Gate | Owner | Blocks |
| --- | --- | --- | --- |
| G1 | Anthropic and Google terms on minors confirmed compatible with parent-account access | Son | Launch, not development (D8) |
| G2 | Vercel account with AI Gateway enabled, credits funded, budget ceiling set | Son | Phase 2 |
| G3 | Google OAuth client ID for the sign-in button | Son | Phase 1 |
| G4 | Deployment URL — Vercel subdomain is sufficient for v1 | Son | Phase 5 |
| G5 | Out-of-band alert channel (ntfy topic or Telegram bot) | Son | Phase 5 |

G1 can block launch outright. It runs in parallel from day one so that a
negative answer arrives while the work is still cheap to redirect.

## Pinned semantics

Correctness points the feature doc deliberately left open, or where an
obvious implementation would be wrong.

- **P1 — Reveal is atomic.** A turn produces exactly one outcome, revealed
  once. Speculative generation and synthesis may run ahead of their checks,
  but discarded work never reaches the client in any form (D4).
- **P2 — Four outcome kinds.** `reply`, `redirect`, `disclosure`, `nudge`.
  Precedence when more than one could apply: `nudge` (nothing was said) →
  `disclosure` → `redirect` → `reply`. Anything else is a non-200.
- **P3 — Disclosure fallback.** If the generated disclosure reply fails its
  clearing check, or TTS fails on it, the response is a fixed operator-authored
  disclosure text. Never `redirect`, never a non-200.
- **P4 — "Little or no real speech".** Fewer than 3 recognized words, or a
  final transcript under 8 characters after trimming. Below that, `nudge`
  without any model call.
- **P5 — Reply length bound.** 3 sentences, ~60 words, enforced in the
  persona prompt and truncated server-side if exceeded. This is what keeps a
  whole-reply check inside the latency bar.
- **P6 — Allowlist is checked per request**, from env, not at sign-in only.
  This is what makes "removing an account ends its access" literally true
  with no session store to invalidate.
- **P7 — One failure shape.** Any pipeline failure returns a non-200 with a
  category string and no content. The client renders the single error state.
  P3 is the only exception.
- **P8 — History is client-supplied.** The server trusts the submitted
  history for conversational continuity only; it grants nothing. Authorization
  comes from the cookie and the allowlist alone.
- **P9 — Interrupted playback does not truncate history.** The full cleared
  reply stays in the client's history, because it was shown whole before a
  word was spoken.

## Phases

### Phase 0 — De-risk on real devices

Throwaway code, deleted afterwards. Three iOS Safari risks and one latency
question, all in one sitting on the two phones the family uses.

1. Web Speech API: interim results, restart-on-silence behaviour, and
   accuracy on the kids' actual voices.
2. Signed httpOnly cookie persistence across days, app switches, and a
   device restart under ITP.
3. Audio unlock: `play()` called in the tap handler, `src` swapped in ~1.5s
   later, confirmed to actually play.
4. Measured round-trip for one Gateway call to Haiku and one OpenAI TTS
   synthesis, to confirm the budget in Phase 2 is real.

**Exit:** all three browser behaviours work on iOS Safari and Android
Chrome, and the measured legs fit the timeline below. Any failure sends us
back to Deepgram streaming on a container host before further work.

### Phase 1 — Access gate

Google sign-in, ID token verified server-side once, signed httpOnly cookie
issued and re-stamped per request, allowlist read from env and checked on
every request (P6). Denied accounts get the plain refusal; nothing else
exists yet.

**Exit:** approved account reaches an empty talk screen; a real non-approved
account cannot, verified against the deployed app.

### Phase 2 — Turn pipeline

`POST /api/turn` accepting `{ history, said }` and returning
`{ kind, text, audio }`, audio base64.

- Disclosure check and reply generation start together; reply discarded if
  disclosure fires (D4).
- Clearing check and TTS start together; audio released only on pass (D4).
- P4 short-circuits to `nudge` before any model call.
- P3 fallback wired.
- Failures produce P7's single shape.

Target timeline, to be checked against Phase 0 measurements:

| | |
| --- | --- |
| 0ms | POST; disclosure check ∥ reply generation |
| ~400ms | disclosure check passes |
| ~1000ms | reply complete; clearing check ∥ TTS |
| ~1400ms | both done, response sent |
| ~1450ms | rendered and playing |

If this misses, the clearing check is the critical path and the first lever
— a smaller model or a single-token verdict — not the transport.

**Exit:** every outcome kind reachable via `curl`, including a forced
clearing failure on a disclosure.

### Phase 3 — Talk screen

One layout, all states: idle, microphone prompt, listening, thinking,
talking, nudge, redirect, disclosure, interrupted, error. Transcript above,
control anchored low, header start-over. Barge-in stops playback and starts
listening (P9).

**Exit:** every state reachable by hand on a phone.

### Phase 4 — Safety verification

- Adversarial prompt suite against the clearing check.
- Disclosure phrasing suite, including one where the redirect could also
  have fired, and one forcing the P3 fallback.
- Fail-closed test: check made unavailable, nothing spoken.
- Register suite as an LLM-judge harness, re-runnable after persona changes.

**Exit:** suites green and committed, so a persona change can be re-checked
in one command.

### Phase 5 — Production hardening

Deploy, then verify against the deployed platform rather than the code:
Vercel runtime logs and AI Gateway observability hold no transcript text or
audio, with Gateway content logging configured off. Alert channel wired for
category and endpoint only. Gateway budget ceiling set and confirmed to fail
loudly.

**Exit:** a real conversation leaves no content in any log surface, and an
induced failure reaches the phone.

### Phase 6 — Register calibration

Real sessions with the kids; tune the persona against the Phase 4 suite
until Outcome 6 holds. Expect several passes.

**Exit:** the feature doc's register outcome confirmed by real use, not
judged output alone.

## Definition of done

Each feature-doc acceptance outcome, with where it is proven.

| Outcome | Verified by | Phase |
| --- | --- | --- |
| 1. Access is closed | Real non-approved account denied on the deployed app; approved session survives a restart | 1, 5 |
| 2. Nothing unchecked reaches the person | Adversarial suite | 4 |
| 3. Disclosures land | Disclosure suite incl. precedence and P3 fallback | 4 |
| 4. Failing closed works | Check made unavailable | 4 |
| 5. Feels like a conversation | Ten-turn script on both phones | 5 |
| 6. Register fits both ends | Judge harness plus real sessions | 6 |
| 7. Nothing is retained by us | Vercel + Gateway log inspection after a real conversation | 5 |
| 8. Awkward moments are gentle | Manual: nudge, interruption, barge-in | 3 |
| 9. Works on real devices | Both phones, incl. permission denial and rapid tapping | 0, 5 |
| 10. Breakage is visible | Induced failure reaches the alert channel | 5 |
| 11. Doesn't pretend to remember | Part of the register suite | 4 |

No phase is deployable while its gates are open. G1 in particular blocks
launch even when every outcome above is green.

## Outstanding doc alignment

Three decisions below change what the feature doc promises about who sees
conversation content. The feature doc is updated in the same change as the
code that introduces them, not retroactively:

1. Web Speech means the browser vendor processes speech — a different trust
   story than a contracted API, and it replaces the STT provider entirely.
2. AI Gateway makes Vercel a processor of prompts and replies.
3. Security says provider calls never go straight from the browser. Web
   Speech is exactly that, and needs a carve-out: the rule exists to keep
   credentials off the device and spend meterable, and Web Speech is free
   and credential-less.

## Decision Log

Append-only. Stable IDs; reversals say what they supersede.

- **D1 (2026-07-26) — Speech recognition runs on device via the Web Speech
  API.** Removes the STT provider, the audio upload, and the WebSocket that
  streaming STT would have required. This is what makes the feature doc's
  live transcript compatible with serverless hosting. Not a privacy gain —
  audio still reaches the browser vendor — so it is justified on cost and
  architecture, and recorded in the doc alignment above. Risk: iOS Safari
  reliability and accuracy on kids' voices, both gating Phase 0.
- **D2 (2026-07-26) — Next.js on Vercel, models through Vercel AI Gateway.**
  One platform for hosting, model routing, spend control, and observability.
  Model switching becomes a string change, which directly serves the
  re-runnable register outcome.
- **D3 (2026-07-26) — No auth library and no database.** Supersedes the
  `AGENTS.md` preference for better-auth, with rationale: a four-address
  allowlist with no user model, no profiles, and no per-user data does not
  need a user system. Google verified once, then a signed httpOnly cookie
  re-stamped per request. Rejected localStorage for the token because Safari
  purges script-writable storage after seven idle days, and a kid cannot
  re-authenticate alone.
- **D4 (2026-07-26) — Speculative execution permitted.** Reply generation
  runs concurrently with the disclosure check, and TTS with the clearing
  check; failing work is discarded unseen. This qualifies the feature doc's
  "before a reply forms", which describes what reaches the person, not what
  the server may compute. Buys roughly 500ms; costs occasional discarded
  spend.
- **D5 (2026-07-26) — One POST per turn, JSON in and out, audio base64.**
  Rejected SSE and streaming audio. Text cannot stream because clearing is
  whole-reply, and streaming audio buys ~300ms at the price of MediaSource
  on iOS Safari. A single response is atomic — a complete cleared turn or an
  error — which preserves the property the whole-reply decision bought.
- **D6 (2026-07-26) — OpenAI TTS through the Gateway rather than ElevenLabs
  direct.** Keeps spend in one dashboard, which was the point of the
  Gateway. Costs latency against ElevenLabs Flash, and puts the audio path
  on a beta lane. Escape hatch: a direct provider call, one model string
  away.
- **D7 (2026-07-26) — The spend ceiling is the Gateway budget, not app
  code.** Exceeding it returns an error that falls into the ordinary failure
  state, which is exactly what the feature doc asks for, with nothing to
  build or keep correct.
- **D8 (2026-07-26) — The provider-terms gate runs in parallel and blocks
  launch, not development.** The mitigation — parent accounts, private
  family use, an adult operator — is already the design, so confirmation is
  unlikely to change the architecture. It must still be answered before the
  kids use it.
