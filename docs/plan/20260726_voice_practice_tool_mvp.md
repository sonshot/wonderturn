# Voice Practice Tool MVP — Implementation Plan

Feature doc: [`docs/feat/20260725_voice_practice_tool_mvp.md`](../feat/20260725_voice_practice_tool_mvp.md)
Diagnostics feature doc: [`docs/feat/20260726_device_diagnostics.md`](../feat/20260726_device_diagnostics.md)

## Status

Phase 0a is complete. Its frozen install, deterministic verification lane,
production build, and local root-route smoke check pass on Node.js 24.
Phase 0b is complete as historical device evidence. Safari delayed atomic
playback passes, offline Web Speech fails as expected, and later Android
testing exposed transcript corruption that made the browser recognizer
unacceptable. D66 replaces that production path with OpenAI live
transcription through AI Gateway.

Phase 0a establishes the durable repository foundation. Phase 0b is a
throwaway device spike whose result can invalidate the application stack;
the operator has explicitly started Phase 1's access-gate slice before that
gate passed (D49). That device gate is now resolved; Phase 1 still does not
exit until its deployed-account checks pass.

Phase 1's auth slice is code-complete locally: the stateless Better Auth
configuration, production proxy callback, dynamic host boundary, and offline
contracts pass `verify` and a production build. G3 and G4 are resolved (D50):
an approved account completes Google SSO on production and the branch preview
in Safari, returns to the initiating host, and survives a reload on both.
The Phase 1 design slice is also code-complete (D51): its theme primitives,
locally bundled Literata variable font, sign-in and denied states, empty talk
screen, and offline token-citation contract pass `verify` and a production
build. A 320px browser check confirms the sign-in action's minimum height,
warm canvas, reading font, and absence of horizontal overflow.
The deployed denied-account and Safari restart-persistence checks remain open,
so the phase is not complete.

Phase 2 has started with its provider-independent text seam and Gateway text
adapters (D52). `runTextTurn` now owns empty-input short-circuiting,
classification/generation concurrency, outcome precedence, speculative
preparation, fail-closed checks, and immutable normalization/truncation. The
classifier prompt is absorbed from the spike, model output is parsed at each
adapter boundary, and the offline concurrency and failure contracts pass.
The bounded HTTP request, success, and content-free failure contracts now pass
offline too, as does the direct ElevenLabs synthesis adapter. Talia, the fixed
copy, `eleven_flash_v2_5`, and the provider cap are operator-approved; all five
fixed MP3s are committed behind a text/voice/model/hash contract and their
rendered delivery is operator-approved (D54, D55). The authenticated
`POST /api/turn` route is code-complete (D59): it re-checks the allowlist,
parses the bounded request, calls the one text seam, pairs fixed outcomes with
bundled audio, and fails closed into the content-free error contract. Its
offline route tests and production build pass. The interactive voice screen now
uses one microphone stream for OpenAI live transcription and honest amplitude
bars. Its authenticated, model-scoped token route, 24 kHz PCM capture,
streaming transcript, manual finalization, explicit lifecycle reducer, atomic
playback, barge-in, bounded sitting, stale-turn rejection, permission states,
client-side fixed failure audio, and latest-turn repair are code-complete
locally. Direct localhost Google SSO reaches this screen and survives a Safari
reload (D61). A follow-up interaction experiment now adds truthful setup and
finalization states, a capture-ready start tone, post-speech automatic stop,
fixed viewport controls, and a prominent latest-turn repair action (D69).
Phase 2 still needs its manual phone outcome, recording-state, repair, and
delayed-stale-result checks before exit.

Phase 3a is complete locally (D70–D72). Its 25 model-backed outcome fixtures
pass through the production text seam, the thirteen-ask register baseline is
committed, and the tracked `spike/` harness is removed. Local model-latency
benchmarking is deliberately absent (D72).

Phase 3b is complete locally (D73–D79). Its expected-behaviour contract and red
run were committed separately before prompt implementation. The final
production seam passes all 30 model-backed outcome fixtures; all 13 active
register rows pass routing and all 81 applicable criteria from the pinned
GPT-5.6 Luna judge. `REG-09` remains skipped with the out-of-scope
cross-session-memory feature. The offline `verify` lane passes 71 tests.

## Scope

This plan owns *how* the MVP gets built and verified. The feature doc owns
what it is and why; scope, fences, and acceptance outcomes are not repeated
here. Where this plan pins a semantic the feature doc left open, it says so
under Pinned semantics.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router), TypeScript |
| Runtime | Node.js 24 LTS |
| Host | Vercel |
| Styling | Tailwind CSS 4; CSS Modules only where utilities are insufficient |
| React optimization | React Compiler |
| Speech in | OpenAI `gpt-realtime-whisper`, streamed as 24 kHz mono PCM through Vercel AI Gateway |
| Models | Vercel AI Gateway via AI SDK |
| Reply | `google/gemini-3.5-flash-lite` (D31) |
| Input classification + clearing checks | `anthropic/claude-haiku-4.5` (D32) |
| Speech out | ElevenLabs, called directly (D33) |
| Auth | Better Auth Google OAuth, stateless encrypted 180-day session, production-domain OAuth proxy for previews |
| Storage | No database or conversation persistence; auth state exists only in encrypted cookies |
| Validation | Zod |
| Spend ceiling | Two provider-native caps: AI Gateway budget and the ElevenLabs plan (D34) |
| Package manager | pnpm, version pinned in `packageManager` |
| Lint | ESLint with the Next.js, React Hooks, and React Compiler rules |
| Format | Prettier |
| Git hooks | Husky |
| CI | GitHub Actions |
| Tests | Vitest, for both offline contracts and on-demand model-backed outcome fixtures |
| Observability | Vercel AI Gateway + Vercel Observability; no custom telemetry backend |

The app is stateless. The client holds the conversation in memory and sends
it with each turn; nothing persists anywhere, which is the no-storage stance
expressed in the wire format rather than merely promised.

**The three model rows are decisions as of 2026-07-26, not conclusions.**
They rest on one afternoon of measurement recorded in
[`20260726_phase0_spike.md`](20260726_phase0_spike.md) — eight round-robin
rounds and an eight-prompt register read, which is enough to start building
and nowhere near enough to settle anything. They are expected to be revisited
once Phase 3a's fixtures and register asks exist, because that is the first
point where a swap can be judged on evidence instead of on a smoke test. The
Gateway is what keeps this cheap: each row is a model string, so revisiting
is a config change and a re-run, not a refactor. Treat a row that has
outlived its evidence as a bug in this table, not as settled architecture.

## Prerequisites and external gates

| | Gate | Owner | Blocks |
| --- | --- | --- | --- |
| G1 | Provider legal and policy review | Son | Access beyond private family use; not this version (D12) |
| G2 | Resolved (D58): Vercel AI Gateway enabled and funded with the planned $10 monthly budget | Son | Phase 2 |
| G3 | Resolved (D50): Google OAuth web client ID and secret; production callback registered at `https://wonderturn.vercel.app/api/auth/callback/google`; dedicated proxy secret shared with previews | Son | Phase 1 |
| G4 | Resolved (D50): `wonderturn.vercel.app` is production and `wonderturn-*-daohoangson.vercel.app` is the project-scoped preview pattern | Son | Phase 1, 4 |
| G5 | Out-of-band alert channel (ntfy topic or Telegram bot) | Son | Phase 4 |
| G6 | Resolved (D54, D55): ElevenLabs synthesis-scoped key, plan cap, Talia voice, and `eleven_flash_v2_5` selected | Son | Phase 2 |

G1 is deliberately deferred for the private, family-only first version. It
does not block implementation or internal use, but it must be resolved before
access expands beyond the family.

## Pinned semantics

Correctness points the feature doc deliberately left open, or where an
obvious implementation would be wrong. Numbering is stable: retired pins
leave their numbers behind rather than causing a renumber (D24).

- **P1 — Reveal is atomic, and obsolete work never commits.** A turn produces
  exactly one outcome, revealed once. Speculative generation and synthesis
  may run ahead of their checks, but discarded work never reaches the client
  in any form (D4). Starting over or beginning a new turn invalidates
  unfinished earlier work; cancellation is best-effort, and correctness comes
  from refusing to render, retain, or play a result for an obsolete turn.
  Interrupted playback does not truncate history — the full cleared reply
  stays in the client's history, because it was shown whole before a word was
  spoken.
- **P2 — Four outcome kinds.** `reply`, `redirect`, `disclosure`, `nudge`.
  A genuinely empty final transcript produces `nudge` before the pipeline. For
  non-empty speech, precedence is `disclosure` → `nudge` → `redirect` →
  `reply`. Anything else is a non-200.
- **P3 — Every fixed response is pinned, with bundled audio.** Each is
  operator-authored, frozen into a committed audio clip, and needs no
  generation, clearing call, or runtime TTS — which makes these the only
  paths with no runtime model dependency: they still work during a provider
  incident, when every other outcome correctly fails closed.

  Three are outcome kinds, returned by the server (P2):
  - `disclosure`: "That sounds important. Please tell a grown-up you trust,
    like a parent, teacher, or another family member, so they can help you."
  - `redirect`: "Let's talk about something else — what else are you curious
    about?"
  - `nudge`: "I didn't quite catch that — want to try again?"

  The fourth is the failure state, rendered entirely client-side because P7's
  error carries no content. It is spoken like the others:
  - `error`: "Something went wrong. Let's try that again."
  - `error`, on a repeat within the same sitting: "It's still not working —
    maybe tell a grown-up so they can help."

  The error is the strongest case for bundled audio, not an afterthought: it
  fires exactly when the pipeline is broken, which may include synthesis, and
  a kid who looked away waiting for a reply would otherwise get silence.

  The operator approved all five lines on 2026-07-26 (D54). Any wording change
  now requires regenerating and re-approving its bundled clip. The committed
  manifest binds every line to its voice, model, byte length, and SHA-256 hash.
  The operator listened to and approved all five rendered clips on 2026-07-26.

  Microphone permission copy is deliberately *not* pinned here. It is
  screen-only, never spoken, and has no clip behind it, so `DESIGN.md` owns it
  (D39). Anything with an audio clip is this plan's; anything read but never
  heard is the design system's.
- **P4 — "Little or no real speech".** No recognized final speech produces
  `nudge` without a model call. Every non-empty transcript goes through the
  input classifier, which returns `disclosure`, `nudge`, or `ordinary`.
  Length alone never bypasses disclosure detection.
- **P5 — Reply length bound.** 3 sentences, ~60 words, enforced in the
  persona prompt and truncated server-side if exceeded. This is what keeps a
  whole-reply check inside the latency bar.
- **P6 — Allowlist is checked per request**, from env, not at sign-in only.
  This is what makes "removing an account ends its access" literally true
  with no session store to invalidate.
- **P7 — One failure shape.** Any pipeline failure returns a non-200 with a
  category string and no content. The client renders the single error state.
- **P8 — History is client-supplied.** The server trusts the submitted
  history for conversational continuity only; it grants nothing. Authorization
  comes from the cookie and the allowlist alone.
- **P11 — Session lifetime is fixed.** The signed cookie lasts 180 days from
  issuance and is not extended by activity. Better Auth stores it as an
  encrypted, httpOnly JWE cookie with no database-backed session. One absolute
  deadline, no sliding window. Expiry returns to sign-in; allowlist removal
  denies the next protected request once the updated env configuration is
  deployed.
- **P12 — Spend is bounded by two provider caps.** The app uses a dedicated
  AI Gateway key with a $10 monthly budget and no automatic top-up. Live
  transcription, language-model work, `test:live`, and `register` share that
  ceiling. A request already accepted by the Gateway, including the request
  that crosses the budget, may finish; later requests fail. Concurrently
  accepted work may also finish.

  Speech synthesis remains outside Gateway (D33), so the ElevenLabs plan needs
  its own cap set to fail closed the same way. Two provider-native ceilings
  cover the whole voice turn without app quota code. D34's earlier estimate
  covered text and synthesis but not live transcription; production
  observability must establish the new per-turn mix before any capacity claim.
- **P13 — Text behaviour has one execution seam.** `runTextTurn` owns input
  classification, candidate generation, precedence, and clearing. Two
  optional injection points keep production and tests on the same code path:
  a candidate-preparation callback, which production supplies as TTS so it
  can run beside clearing, and a candidate override, which tests supply to
  feed known-bad replies straight to the clearing check. Fixed outcome audio
  is attached outside this seam. Production and every model-backed test call
  this function, so tests cannot drift into a second implementation of the
  product.
- **P18 — A cleared string is immutable.** P5's truncation happens before the
  clearing check, on normalized text, at a sentence boundary. The bytes that
  are cleared are the bytes that are rendered and synthesized. Nothing
  rewrites, re-truncates, or re-normalizes a reply after it has passed its
  check.

  Normalization strips markdown. The spike found models returning `**magma**`
  and `*Maya was reluctant…*`, which in a voice channel are either spoken
  aloud as punctuation or silently mangled. Truncation is also detected, not
  just applied: a candidate that ran into the token cap mid-clause is cut
  back to the last complete sentence, because a spoken reply that stops
  mid-sentence is worse than a short one.
- **P19 — Each check sees only its own subject.** The clearing check receives
  the candidate reply alone; the input classifier receives `said` alone.
  Neither receives conversation history. P8's client-supplied history is a
  generation input, never a checker input, so a modified client cannot plant
  a prior turn that instructs a reviewer.
- **P20 — The turn and the sitting are bounded.** A single recording stops
  itself after 60 seconds or after three seconds below normalized RMS level
  `0.1` once a sample at or above that level has established that speech
  began. Both route through the ordinary finalization path, so neither reads
  as a failure; `Done` remains available.
  The request schema caps history at 20 turns and each entry and the current
  `said` value at 1,000 characters, with the oldest turns dropped client-side.
  This is a cost bound as much as a latency one: stateless re-send makes token
  cost quadratic in turn count, so one long happy session is the realistic way
  P12's ceiling gets hit. The wait is bounded too: the client fetch carries
  `AbortSignal.timeout(15_000)`, and the timeout resolves to P7's one failure
  shape, so the thinking cue cannot run forever.
- **P21 — Repair rewinds exactly one exchange.** `That's not what I said` is
  available in the fixed control zone only for the newest recognized human
  turn during thinking, speaking, and idle. It invalidates active work,
  removes that turn plus the zero or one AI reply based on it from both
  rendered and submitted history, and starts the ordinary setup path
  immediately. It never changes earlier exchanges, asks for confirmation,
  retains audio, or introduces a repair lifecycle state.
- **P22 — Active recording begins at capture readiness.** The tap enters
  `starting`; it does not claim to listen. Token and microphone setup run
  concurrently. After both succeed, a 160ms Web Audio cue plays before PCM
  capture begins, then the client enters `listening`. Manual, silence, and
  length-limit stops end capture and its visual treatment synchronously,
  enter `finishing` while the provider finalizes the transcript, and only then
  enter the turn pipeline. Aborted setup may not play a stale cue or open a
  stale capture.

## Phases

### Phase 0a — Repository foundation

Scaffold the durable project before feature code:

- Node.js 24 LTS and Next.js App Router with strict TypeScript, installed with
  the pinned pnpm version and committed lockfile. Follow the current
  `create-next-app` structure: root `app/`, the default `@/*` alias, and
  Turbopack. There is no `src/` directory (D44).
- Tailwind CSS 4 installed as the styling primitive, with CSS Modules available
  where utilities are insufficient. Phase 0a stays visually generic; the
  design system is implemented only when a user-visible phase begins. Do not
  install a component library until a concrete component needs one (D44).
- React Compiler enabled through Next.js. Use focused ESLint coverage for
  Next.js, React Hooks, and compiler correctness; do not add cosmetic rules
  whose only effect is churn (D44).
- Prettier, Vitest, and Husky.
- Package scripts:
  - `format` — Prettier write.
  - `format:check` — Prettier check.
  - `lint` — ESLint.
  - `lint:fix` — ESLint write.
  - `typecheck` — `tsc --noEmit`.
  - `test` — Vitest in non-watch mode, offline tests only.
  - `verify` — `format:check`, `lint`, `typecheck`, and `test`, in that order.
  - `test:live` — the model-backed outcome fixtures, added in Phase 3a. Never
    part of `verify`, never run by a hook or by CI.
  - `register` — the register asks, dumped for reading, added in Phase 3a.
    Same exclusions.
- A Husky pre-commit hook that runs `pnpm lint`, `pnpm typecheck`, and
  `pnpm test`. All three are offline and fast enough to survive daily use,
  and the offline set includes the fail-closed contracts, which have to be a
  gate rather than a habit to mean anything (D29, D44). Formatting stays out
  of the hook.
- A GitHub Actions workflow on push to any branch running `pnpm install
  --frozen-lockfile` then `pnpm verify`. No required status checks and no
  pull-request gating: there is no second contributor whose bad commit needs
  stopping, and Vercel already fails the build on a type error.
- `README.md` updated with the runtime, install, development, build, and
  verification instructions that now exist.

**Exit:** a clean `pnpm install --frozen-lockfile`, `pnpm verify`, and
`pnpm build` pass on Node.js 24, and the local development server returns the
root route successfully.

### Phase 0b — De-risk on real devices

Run the Vercel branch preview on the two phones the family uses. The browser
harness begins here, then remains as the durable `/diagnostics` operator
surface described by D46.

Phase 0b is **complete** (D57). Measurements, model selection, the register
comparison, and the Android/Safari observations are recorded in
[`20260726_phase0_spike.md`](20260726_phase0_spike.md), with its harness
committed under `spike/` and absorbed per D30. Safari delayed atomic playback
passes. Offline recognition fails in the tested context, and child-voice
accuracy is low; the operator accepts both outcomes for this private,
online-only MVP.

1. Web Speech API: interim results, restart-on-silence behaviour, accuracy
   on the kids' actual voices, and, where convenient, the observed
   local-or-vendor processing boundary on each target browser.
2. Audio unlock: `play()` called in the tap handler, `src` swapped in ~1.5s
   later, confirmed to actually play.
3. Remote speech recognition comparison: one bounded recording of the selected
   test sentence is sent concurrently to
   `openai/gpt-4o-mini-transcribe` and `xai/grok-stt` through AI Gateway.
   Their transcripts and request timings are compared with the Web Speech result
   on the same device. The recording is not logged or retained by the app.

**Exit:** recognition is accurate enough on the kids' actual voices, delayed
atomic playback works on iOS Safari and Android Chrome, and the remote
comparison works on both. A Web Speech availability or accuracy failure sends
us back to server-side speech recognition on a container host before further
work; failure while deliberately offline does not.

The diagnostic surface itself is complete when it infers the device from the
user agent, preserves the browser checks above, validates direct submissions at
the server boundary, compares browser recognition with two Gateway-routed
providers, and returns a report reference. Its temporary sink is the server
console; persistent report or audio storage remains out of scope.

### Phase 1 — Access gate

Better Auth runs Google's authorization-code flow and creates a stateless P11
session without sliding refresh. Its OAuth Proxy sends every preview callback
through `https://wonderturn.vercel.app/api/auth/callback/google`, then returns
one short-lived encrypted result to the initiating preview. Dynamic base-URL
resolution accepts only the production host, localhost, and
`wonderturn-*-daohoangson.vercel.app`; a broad `*.vercel.app` trust boundary is
rejected. The proxy secret is dedicated to this handoff and shared across
production and previews, while the Better Auth session secret may remain
environment-specific.

The allowlist remains application authorization: it is read from env and
checked on every protected request (P6), independently of Better Auth's
identity session. Denied accounts get the plain refusal; nothing else exists
yet. There is no auth database, application account, or profile.

Cookie survival under Safari's ITP is observed here, on the deployment's own
stable origin, rather than spiked in Phase 0b (D15).

**The design system moves into code here** (D45), because this phase already
renders three surfaces `DESIGN.md` fully specifies — the sign-in gate, the
denied state, and the empty talk screen — and because Literata has to be
configured for the gate's heading regardless.

- Primitives into Tailwind's `@theme`: colors, both font families, the type
  scale, spacing, radii. Names are the real custom properties (`--color-canvas`,
  `--font-reading`, `--text-transcript`), which is what makes a citation in
  `DESIGN.md` greppable rather than decorative.
- Literata self-hosted through `next/font`, latin subset, one variable weight
  range, `font-display: optional`, with the declared system-serif fallback.
- The component tokens become real components rather than theme entries. A
  value consumed by exactly one component was never a token, and that block is
  where the `height`-instead-of-`minHeight` defect lived.
- Only what this phase renders. `status-thinking`, `status-speaking`,
  `talk-control-pressed`, `level-meter`, `error-notice`, and `glyph.controlSize`
  wait for Phase 2 and land beside the states that consume them. A token with no
  consumer cannot be told right from wrong.
- `DESIGN.md`'s frontmatter is deleted in the same change, not left behind as a
  comment. The same argument as D30: the copy nobody runs is the one that looks
  authoritative later.
- One offline Vitest asserts every `--token` cited in `DESIGN.md` prose exists
  in the theme. Deterministic and free, so it runs in `verify` and the hook. It
  replaces no value comparison — after this change there are no duplicated
  values to compare — and instead catches the one coupling that remains, a
  document citing a token somebody renamed.

The talk control is rendered to spec but inert in this phase, so Phase 2's work
on it is purely behavioural. A disabled-looking control is not a state
`DESIGN.md` has.

**Exit:** approved account reaches an empty talk screen; a real non-approved
account cannot, verified against the deployed app. The three rendered surfaces
match `DESIGN.md`, `DESIGN.md` declares no values of its own, and the token
citation test passes in `verify`.

### Phase 2 — Turn pipeline and talk screen

Built together, because the pipeline cannot be meaningfully exercised without
the screen and the screen has nothing to show without the pipeline (D23).
The operator-facing checks and exact spoken lines live in the
[`Phase 2 Voice Turn — Manual Test Script`](20260726_phase2_voice_test.md).
That script keeps real-device voice evidence separate from the forced
clearing, delay, and provider-failure cases that require controlled
instrumentation.

The browser obtains an authenticated 60-second token from
`POST /api/transcriptions/token`, scoped to
`openai/gpt-realtime-whisper`. It sends the sole microphone stream directly to
AI Gateway as 24 kHz mono PCM, uses the same samples for the level cue, and
updates the visible `You` turn from streaming transcript parts. Tapping `Done`
closes the audio stream; only the final transcript enters the turn pipeline.
Any token, stream, provider-contract, or finalization failure uses P7's single
failure state. The long-lived Gateway credential remains server-only (D66).

`POST /api/turn` accepts `{ history, said }` — Zod-parsed with P20's bounds —
and returns `{ kind, text, audio }`, with generated or bundled audio returned
base64. The route calls P13's `runTextTurn`; there is no second text pipeline
hidden inside the HTTP handler.

- A genuinely empty final transcript short-circuits to `nudge` before any model
  call (P4).
- For non-empty speech, input classification and candidate reply generation
  start together. A `disclosure` or `nudge` classification discards the
  candidate and returns its fixed text and bundled audio (D4).
- For `ordinary`, the candidate is normalized and truncated (P18), then the
  clearing check and TTS start together. A clearing rejection discards the
  speculative audio and returns the fixed redirect with bundled audio. Only a
  clearing pass plus successful TTS releases the candidate reply (D4).
- Each check receives only its own subject (P19).
- A required check or ordinary-reply TTS failure produces P7's single error
  shape; losing speculative branches are cancelled where practical and
  always discarded.

The classifier prompt is adopted here from the spike, not written fresh
(D30). It carries category definitions, an explicit instruction to err
toward `disclosure`, and worked examples, because the spike showed a naive
one-line prompt silently routing real disclosures to `ordinary` or `nudge`.
It is production code and versioned as such, not a fixture.

The screen is one layout with **seven** states: idle, starting, listening,
finishing, thinking, speaking, error (D69 supersedes D38's five-state count).
`Nudge`, `redirect`, and `disclosure` remain three strings arriving through
the `speaking` path, `interrupted` is `idle` after `pause()`, and the
microphone prompt is `idle` with a different label. Composition, state
presentation, and on-screen copy come from `DESIGN.md` and are not restated
here (D36). Barge-in stops playback and enters setup. A client turn identifier
enforces P1; request cancellation only saves work.

The newest completed human turn carries `That's not what I said` in the fixed
control zone through thinking, speaking, and idle. It applies P21 before
opening the same setup and transcription path as `Talk`; the replacement is a
new turn rather than an edit to a submitted request. The existing client turn
identifier is the stale-result boundary when repair races a pending reply.

Target timeline, to be checked against Phase 0b measurements:

| | |
| --- | --- |
| 0ms | POST; input classification ∥ reply generation |
| ~400ms | input classification returns `ordinary` |
| ~1000ms | reply complete; clearing check ∥ TTS |
| ~1400ms | both done, response sent |
| ~1450ms | rendered and playing |

If this misses, the clearing check is the critical path and the first lever
— a smaller model or a single-token verdict — not the transport.

**Exit:** every outcome kind is reachable by hand on a phone, including a
forced clearing rejection that discards completed TTS. With a deliberately
delayed turn, starting over, starting a new turn, and saying the latest turn
again prevent stale text and audio from appearing. Repair preserves earlier
exchanges while removing the discarded wording from future model history.

### Phase 3a — Safety verification and current-prompt baseline

Phase 3a is **complete** (D71). `pnpm test:live` passes 25/25 fixtures,
`pnpm register` prints all thirteen asks, the current-prompt evidence is
committed under `docs/eval/`, and the tracked Phase 0 harness is gone.

This phase deliberately freezes `INPUT_CLASSIFIER_PROMPT`, `REPLY_PROMPT`, and
all fixed response copy. Its job is to make the existing behaviour repeatable
before feedback changes it. The register therefore includes labelled baseline
probes for an intelligible speaker who does not know what to talk about or has
not expressed a complete thought; those rows are printed for inspection and
are not prose assertions.

One Vitest file of model-backed outcome fixtures calling `runTextTurn`
directly through P13, with no browser, microphone, transcription, TTS,
or HTTP route. Roughly 25 fixtures, asserting on `kind` only and never on
prose — a discrete assertion that survives a model change, where a graded
rubric would not (D21).

- Curated adversarial inputs, asserting the outcome is never `reply`.
- Known-bad candidate replies injected through P13's candidate override, so
  the clearing check is exercised directly. Without this the check may never
  fire in a passing suite, and the suite would prove nothing about it.
- Disclosure fixtures, including one where redirect could also have fired and
  short phrases such as "help me."
- Disclosure and nudge **false positives**, which precedence makes expensive:
  third-person questions ("why do people bully other kids?"), story
  narration, quoting a book, hypotheticals. A curiosity question answered
  with the fixed adult-pointing text teaches the kid the tool is broken on
  interesting subjects (D26).

Run on demand as `pnpm test:live`, when a prompt, classifier, clearing rule,
or model string changes. Not a commit hook, not a merge gate, not a CI job:
it costs money, needs network, and there is no second contributor to gate.

Separately, and offline, ordinary Vitest tests force the input classifier,
the clearing check, and ordinary TTS to fail one at a time, and verify P7's
one failure shape and that nothing is committed. These are deterministic and
free, so they run in `verify` on every commit. They are the difference
between failing closed being tested and being believed.

Alongside these, and separately from them, a committed file of register asks
spanning the youngest user and the English-practicing adult, run by
`pnpm register` and **dumped to the terminal for the operator to read**. It
asserts nothing and has no judge — the grader is the person who eats dinner
with all four users. It includes the "what do you remember from last time?"
ask, which is where Outcome 11 is checked. What D21 deleted was the graded
rubric, not the asks; the asks are what make the register outcome
re-runnable after a persona change, which the feature doc requires and a
play session cannot provide on demand (D29).

Committed fixtures contain synthetic text only.

The disclosure fixtures and the register asks are **adopted from the spike**
rather than authored fresh (D30): the ten labelled disclosure cases that took
all three candidate models to ten out of ten, and the eight tagged register
asks spanning curiosity, a sensitive topic, family topics, and adult English
practice. `spike/` is deleted in this phase once they and the classifier
prompt are absorbed, leaving the suite as the single source of truth.

The Phase 0 latency harness is not migrated. Local measurements include the
operator's network path and do not represent the deployed Vercel region or the
end-to-end phone experience. Phase 4's deployed ten-turn voice measurement is
the latency evidence for this product; a future model comparison must run on
that deployed path rather than reintroducing a local benchmark command (D72).

**Exit:** the offline contract tests pass in `verify`, `pnpm test:live`
produces the expected `kind` for every fixture, and `spike/` no longer
exists.

### Phase 3b — Child scaffolding calibration

Phase 3b is **complete locally** (D77–D79). The reviewed contract was committed at
`aa1175a` before any prompt implementation. The final `pnpm test:live` run
passes 30/30 outcome fixtures, and `pnpm register` passes all 13 active rows
and all 81 applicable judge criteria while printing `REG-09` as deferred.

Begin with a review gate: commit no prompt fix in the same slice that proposes
the expected-behaviour cases and qualitative rubric. Run the cases against the
unchanged production prompts, record the failures, and stop. A human must
approve the exact inputs, expected outcome kinds, and applicable prose criteria
before classifier, reply, or clearing changes begin (D73, D75).

Start from Phase 3a's committed register output and the real-user feedback
captured in the feature doc. Change the smallest production boundary that
separates intelligible uncertainty from genuinely content-free recognition,
then tune the reply persona so a child who is stuck gets brief encouragement
and at least one concrete new topic or direction. When the child gets stuck on
an earlier question, reword that question more simply; when current-session
context exists, continue it or suggest another topic. A necessary clarifying
question is allowed; a question whose only purpose is to prolong the exchange
is not. Keep the approved faith-family deferral green. The cross-session-memory
ask is skipped until the separately deferred memory feature exists (D76).

Extend the live outcome fixtures when classifier semantics change, and extend
the register probes and their LLM-judged criteria when prose requirements
change. Re-run `pnpm test:live` and `pnpm register` after every prompt change,
comparing the printed verdicts and reasons with the Phase 3a baseline. If fixed
nudge copy changes, regenerate and re-approve its bundled audio and manifest
in the same slice.

**Exit:** the safety fixtures still pass; every register row matches its
expected kind and receives `pass` for every applicable item from the pinned
LLM judge; and the feature doc's updated register promise has evidence ready
for Phase 5 sessions with the kids.

### Phase 4 — Production hardening

Deploy, then verify against the deployed platform rather than the code:
Vercel runtime logs and AI Gateway observability hold no transcript text or
audio, with Gateway content logging configured off. Alert channel wired for
category and endpoint only. The dedicated Gateway key has P12's budget and
automatic top-up disabled. A deliberately tiny test budget proves the
crossing request may complete and the next request is rejected before new
provider work begins.

Budget exhaustion routes to G5's channel as its own alert category. The
feature doc deliberately gives the person no cost signal, which means the
operator is the only one who can learn the tool went quiet for a reason other
than breakage.

AI Gateway's built-in views provide request volume, model/provider, latency,
token, and spend visibility; no custom dashboard or telemetry store is built.

**Exit:** a real conversation leaves no content in any log surface, and an
induced failure reaches the phone.

### Phase 5 — Register calibration

Real sessions with the kids. Tune the persona by reading `pnpm register`
output between sessions; re-run the Phase 3a `kind` fixtures after each change
as a safety regression guard, not as a register signal — they assert on
outcome kind and never on prose, so they cannot tell you whether a reply
talks down to an 8-year-old. Expect several passes.

A calibration month draws three ways on P12's single ceiling: ordinary family
use, `register` passes, and `test:live` runs. Whether that adds up to a
problem depends on per-turn cost, which the spike hasn't settled — revisit it
then. The failure mode to avoid is the tool going quiet mid-session with the
kids while you are trying to judge whether it feels good.

**Exit:** the feature doc's register outcome confirmed by real use.

## Definition of done

Each feature-doc acceptance outcome, with where it is proven.

| Outcome | Verified by | Phase |
| --- | --- | --- |
| 1. Access is closed | Real non-approved account denied; approved session survives a restart; removing an authenticated account denies its next request after the env update is deployed | 1, 4 |
| 2. Nothing unchecked reaches the person | `test:live` adversarial fixtures plus injected known-bad candidates against `runTextTurn`; offline commit-gate contracts | 3a |
| 3. Disclosures land | `test:live` disclosure fixtures incl. precedence, short phrases, and false positives; bundled text/audio integration check | 3a |
| 4. Failing closed works | Offline Vitest forces input classifier, clearing check, and ordinary TTS unavailable separately | 3a |
| 5. Feels like a conversation | Ten-turn voice script on both phones, against the bar as written; median at risk pending the Vercel timing measurement (D35) | 4 |
| 6. Register fits both ends | `pnpm register` LLM-judged asks after any persona change, including stuck/unclear probes, plus real sessions with the kids | 3a, 3b, 5 |
| 7. Nothing is retained by us | Vercel + Gateway log inspection after a real conversation | 4 |
| 8. Awkward moments are gentle | Manual: nudge, interruption, barge-in; delayed stale results after start-over/new turn | 2 |
| 9. Works on real devices | Both phones, incl. permission denial and rapid tapping | 0b, 4 |
| 10. Breakage is visible | Induced failure reaches the alert channel | 4 |
| 11. Doesn't pretend to remember | Injected relationship/memory claim rejected by the clearing fixture; natural cross-session recall is deferred with the memory feature | 3a, future |
| 12. Spend ceiling holds | Tiny Gateway budget: crossing request may finish; next request rejected before new provider work | 4 |
| 13. Mishearing is recoverable | Reducer contract plus manual repair during thinking, speaking, and idle on both phones; delayed discarded result never surfaces | 2, 4 |
| 14. Recording state is truthful and fixed | Reducer and silence-detector contracts plus both-phone checks for setup cue, recording treatment, auto-stop, reduced motion, and long transcript scrolling with controls retained | 2, 4 |

G1 is a future gate on expanding access, not an MVP gate.

## Resolved doc alignment

The feature doc is updated alongside this plan: live speech uses an
authenticated short-lived Gateway token and a direct browser-to-provider
stream while long-lived credentials remain server-side; provider legal and
policy review is deferred for the private family version; the session window
is fixed; and disclosures use bundled text and audio.
The superseding Decision Log entries below preserve the earlier choices they
replace.

Its `UI/UX` section is also gone, replaced by `Interaction promises` that
delegate every question of form to `DESIGN.md` (D36). Layout, mockups, and
component copy now live in one place, so this plan's phases describe behaviour
and stop restating the screen.

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
- **D9 (2026-07-26) — Browser-managed speech has no on-device privacy
  assumption. Supersedes D1.** Web Speech remains the Phase 0 candidate, but
  processing may be local or may reach the browser or platform vendor. The
  app performs no audio upload and gives the speech service no app
  credentials; the feature doc records the vendor boundary now.
- **D10 (2026-07-26) — A disclosure always uses one fixed response.** No
  disclosure reply is generated, cleared, or synthesized at runtime. The
  operator-authored text and matching audio are bundled with the app. This
  deletes the TTS-failure fallback branch while preserving the distinct,
  warm, adult-pointing outcome.
- **D11 (2026-07-26) — Session lifetime is fixed. Supersedes the
  re-stamping part of D3.** The no-library, no-database choice remains, but
  its cookie expires 180 days after issuance and activity never extends it.
  One absolute deadline is simpler to implement and audit than sliding plus
  absolute windows.
- **D12 (2026-07-26) — Provider legal and policy review is deferred.
  Supersedes D8.** It is explicitly outside the private, family-only first
  version and does not block internal use. It becomes a gate before access
  expands beyond the family. This is an accepted external risk, not a
  compliance claim.
- **D13 (2026-07-26) — The Gateway budget is $10 monthly on one dedicated
  key.** Supersedes D7's unpinned ceiling. Automatic top-up is off. Gateway
  admission is the boundary: already accepted and concurrently accepted
  work may finish, while later requests fail until the monthly reset or an
  operator change.
- **D14 (2026-07-26) — The input check is a three-way classifier.** Extends
  D4. Every non-empty transcript is classified as `disclosure`, `nudge`, or
  `ordinary` while the candidate reply runs in parallel. Only genuinely
  empty recognition bypasses it, so short disclosures cannot be mistaken
  for empty input.
- **D15 (2026-07-26) — The cookie persistence spike is dropped.** Safari's
  seven-day purge targets script-writable storage, which a server-set
  `HttpOnly` cookie is not, so the risk does not justify a week of wall
  time — and a quick tunnel cannot hold one origin stable that long anyway.
  Survival is observed in Phase 1 on the deployment's own origin. Accepted
  cost: if it fails there, Phase 1's cookie work is redone.
- **D16 (2026-07-26) — Promptfoo owns text evals and red teaming.** Replaces
  the bespoke LLM-judge harness named in the original stack. Promptfoo
  already provides fixtures, deterministic and model-graded assertions,
  latency metrics, red-team generation, reports, and CI behaviour. The app
  owns only a thin TypeScript provider that invokes the real text seam.
- **D17 (2026-07-26) — Text evaluation and voice delivery share one
  orchestration.** `runTextTurn` accepts optional candidate preparation.
  Production supplies TTS, preserving D4's parallel clearing and synthesis;
  Promptfoo omits it, exercising the same classification, generation,
  precedence, and clearing without touching the voice pipeline.
- **D18 (2026-07-26) — Vercel owns MVP observability.** AI Gateway and
  Vercel Observability provide the existing model, cost, token, latency,
  request, and function views. The app adds only sanitized failure logs and
  the out-of-band alert required by the feature. A custom telemetry backend,
  dashboard, and product analytics remain out of scope.
- **D19 (2026-07-26) — Eval spend is isolated from production.** Promptfoo's
  system-under-test calls and judge calls use one eval-only Gateway key with
  a $5 monthly budget and no automatic top-up. Production uses only P12's
  app key. This buys a hard operational boundary without app code.
- **D20 (2026-07-26) — Every commit runs the complete deterministic
  verification lane; model-backed checks run in GitHub.** The repository
  uses pnpm, ESLint, Prettier, TypeScript, Vitest, and Husky rather than
  custom tooling. `verify:fast` is the single local and CI entry point and
  the pre-commit hook runs it whole. Promptfoo text evals run on pull
  requests; red teaming and text benchmarks use manual GitHub workflows.
  This keeps commits fail-fast without putting secrets, network latency, or
  model spend in the local hook.
- **D21 (2026-07-26) — Safety verification is one on-demand Vitest file.
  Supersedes D16 and D19; narrows D17.** Promptfoo, the custom provider, the
  `gpt-5.4-mini` judge, `llm-rubric` register grading, the red-team config,
  the text benchmark, the three eval workflows, and the eval-only Gateway key
  are all removed. What replaces them is ~25 fixtures through `runTextTurn`
  asserting on `kind` only. Rationale: a pinned judge model is not stable
  across its own revisions, so a model-graded threshold drifts and gets
  retuned to fit the output, which measures nothing. Discrete outcome
  assertions survive a model change. Register quality was the one thing the
  rubric was really for, and the operator eats dinner with all four users —
  that signal is free and better. Accepted cost: no generated adversarial
  phrasings, so the curated fixtures must be extended by hand when the kids
  find something. D17's shared-orchestration principle survives and is
  strengthened; only its Promptfoo consumer is replaced.
- **D22 (2026-07-26) — Local tooling and CI are reduced to what a solo
  developer will actually run. Supersedes D20.** ESLint is dropped: strict
  TypeScript already catches what matters here. The pre-commit hook runs
  `typecheck` only, because a hook slow enough to resent is a hook that gets
  `--no-verify`'d and then provides negative value. `verify` remains the full
  deterministic lane, run deliberately and in one CI workflow on push. No
  required status checks and no pull-request gating: there is no second
  contributor, and Vercel already fails the build on a type error.
- **D23 (2026-07-26) — Phases collapse and exit criteria stop duplicating
  each other.** The turn pipeline and the talk screen become one phase: the
  pipeline cannot be meaningfully exercised without a UI, and the previous
  Phase 2 exit — proving every outcome kind through both `runTextTurn` and
  `curl` — was re-verified by tapping a button one phase later. Phase gating
  exists to coordinate people and to stop half-finished work reaching users;
  neither problem exists here.
- **D24 (2026-07-26) — The pinned-semantics list is trimmed to load-bearing
  pins.** P9 and P10 fold into P1, which they were restating. P14, P15, P16,
  and P17 are deleted as verbatim restatements of D16, D18, D19, and D20 in
  the same file. Retired numbers are not reused, so existing references stay
  valid. A pin earns its place only when the obvious implementation is wrong
  and the wrongness is a real defect.
- **D25 (2026-07-26) — Three safety semantics are pinned that the design
  previously left to chance.** P18: truncation happens before clearing, so a
  cleared string is immutable — the previous ordering allowed clearing string
  X and delivering X′, which voids the guarantee outright and can invert
  meaning mid-sentence. P19: each check sees only its own subject, closing
  the path by which P8's client-supplied history could instruct a reviewer
  rather than merely inform a generator. P20: the turn and the sitting are
  bounded, because stateless re-send makes token cost quadratic in turn count,
  and an unbounded sitting is the one shape that turns a comfortable ceiling
  into a tight one.
- **D26 (2026-07-26) — Disclosure and nudge false positives get explicit
  coverage. Extends D14.** Precedence makes `disclosure` maximally sticky, so
  its false-positive cost is high and was measured nowhere: "why do people
  bully other kids?" is exactly the curiosity question this tool exists for,
  and answering it with the fixed adult-pointing text teaches the kid the
  tool is broken on interesting subjects.
- **D27 (2026-07-26) — The multilingual-input promise is withdrawn.** The
  feature doc previously said the tool "understands and replies in English
  whatever it's addressed in." A locale-bound recognizer cannot deliver that:
  Vietnamese addressed to an English recognizer arrives as garbled English,
  not as text a model can understand and answer. `SpeechRecognition.lang` is
  fixed to English and non-English input is not a case to detect or recover
  from — it takes the existing P4 and classifier paths unchanged. The feature
  doc's out-of-scope list now states this. Narrows promised scope; no
  implementation cost either way.
- **D28 (2026-07-26) — The disclosure outcome stays invisible to the
  operator.** Nothing tells the parent that the adult-pointing response
  fired. This falls out of the no-storage and no-analytics stances but was
  never argued, so the feature doc now states it as a deliberate, accepted
  limitation rather than an omission. The counter-case — a content-free ping
  over the existing alert channel, with the kids told it works that way — is
  recorded there as the thing to revisit, and depends on D26's false-positive
  work landing first, or it is pure noise.
- **D29 (2026-07-26) — Two corrections to D21 and D22, found by review.**
  First: D21 deleted the register *asks* along with the register *judge*, but
  only the judge was argued. The feature doc requires a fixed suite that is
  re-runnable after any persona change, and a play session with two children
  is not re-runnable on demand — so outcomes 6 and 11 had nothing behind them
  between D21 and this entry. A committed asks file, dumped for the operator
  to read with no judge and no assertions, restores the guarantee at none of
  the cost D21 objected to. Second: D22 reduced the pre-commit hook to
  `typecheck`, which made the fail-closed contracts advisory while the plan
  still claimed they gated every commit. They are offline, deterministic, and
  fast, and they are the only thing separating "fails closed" from a belief,
  so the hook runs `typecheck` and `test`. Formatting stays out.
- **D30 (2026-07-26) — The spike is absorbed, then deleted.** The Phase 0
  harness in `spike/` is committed as evidence for its findings, but it is
  not a second home for product assets. Four things migrate: the classifier
  prompt into production code in Phase 2, and the labelled disclosure cases,
  the tagged register asks, and the interleaved latency method into the
  Phase 3 suite. `spike/` is removed in Phase 3 once they are absorbed. The
  point is a single source of truth — a prompt or fixture that exists in two
  places will drift, and the copy nobody runs is the one that looks
  authoritative later. The findings document survives the deletion; it
  records why decisions were made, which the code cannot.
- **D31 (2026-07-26) — The reply model is `google/gemini-3.5-flash-lite`.
  Supersedes the Sonnet 5 row, and the Haiku 4.5 that briefly replaced it.**
  Sonnet 5 was chosen for register quality before anything was measured; it
  is 2.7s median against flash-lite's 1.48s. Among the fast tier, flash-lite
  won the dimension hardest to fix by prompting — it declined to take a
  position on faith and pointed at the family, where `gpt-5.6-luna` moralized
  and `mistral-medium-3.5` offered an opinion. It also emits no markdown,
  sits closest to the ~60-word bound, and costs three to five times less.
  **This is a decision as of today, on eight round-robin rounds and eight
  register prompts.** It is expected to be re-examined once Phase 3 exists;
  the watch items are one dropped call in eight, and an exclamatory tone that
  could drift toward the companion register the feature doc forbids.
- **D32 (2026-07-26) — The checks stay on `anthropic/claude-haiku-4.5`, a
  different model family from the reply.** All three candidates scored 10/10
  on disclosure classification once the prompt was written properly, so
  accuracy did not decide this. Two things did. Haiku was the faster of the
  viable options on short check calls, and check cost is negligible at ~8
  output tokens. More importantly, a clearing check performed by the same
  model that wrote the reply shares its blind spots: a reply a model was
  willing to generate is one it is more likely to judge acceptable. A
  different family decorrelates that failure mode for no meaningful cost.
  This is a judgment, not a measurement — the spike could not test it.
- **D33 (2026-07-26) — Speech synthesis leaves the Gateway. Supersedes D6.**
  D6 chose OpenAI TTS through the Gateway to keep spend in one dashboard.
  Every Gateway speech model measures 4.7–10.5s on a funded key, including
  the newest, against 0.25–0.67s to first audio from ElevenLabs streaming.
  A five-to-tenfold latency gap is not a price worth paying for a tidier
  bill. The Gateway lists only three speech models, two from 2023, so this
  is a limitation of that catalog rather than of any one model. Model choice
  within ElevenLabs is deferred to Phase 0b: `eleven_v3` if progressive
  playback works on iOS Safari, since its 0.67s first audio arrives before
  the clearing check finishes and therefore costs nothing; otherwise
  `eleven_flash_v2_5` with the atomic single response.
- **D34 (2026-07-26) — The spend ceiling is two provider-native caps.
  Extends D13.** The $10 Gateway budget stands and buys roughly 20,000 turns
  of language-model work, which is not the binding constraint. Speech is
  80–90% of per-turn cost and now sits outside the Gateway, so the
  ElevenLabs plan needs its own cap. Both fail closed into P7's one error
  shape; neither requires app code. The cost of D33 is a second dashboard,
  and the honest consequence is that no single number expresses the ceiling.
- **D35 (2026-07-26) — Feature-doc Outcome 5 is at risk, not renegotiated.**
  The 4-second ceiling holds comfortably on the chosen models. The 2-second
  median is unproven in either direction, so the feature doc is left
  unchanged and the entry it requires for a change has not been earned.

  An earlier reading of the spike called the median unreachable on a measured
  floor near 2.6s. That reading is withdrawn. Streaming the same calls shows
  the cost is almost entirely pre-token: a check call spends ~1.09s waiting
  for response headers and 0.01s generating, and the reply spends 1.17s
  before its first byte and 0.78s producing text. Generation is not the
  constraint, and no model swap addresses it — `mistral-medium-3.5` generates
  slower than `gemini-3.5-flash-lite` and only looked faster because its
  overhead happened to be lower on that run.

  With two sequential stages, `2 × overhead + 0.78 + 0.10 < 2.0` means
  **per-call overhead under roughly 0.56s clears the median.** Every spike
  figure was taken from a laptop, so its round-trip to the Gateway is inside
  that ~1.1s; a Vercel function calling the Gateway is a datacenter hop
  instead. Whether that closes the gap is unmeasured, and a tunnel cannot
  measure it because the code still executes locally.

  Settled by a timing endpoint deployed to Vercel, which also yields the
  cold-start figures no local run can produce. Until then, Outcome 5 stands
  as written.
- **D36 (2026-07-26) — One design system, one document; feature docs stop
  owning form.** `DESIGN.md` at the repository root is canonical and
  deliberately undated, and owns the visual language, screen composition,
  states, controls, and pinned on-screen copy across every feature — features
  are many and dated, the design system is one and current. The feature doc's
  `UI/UX` section becomes `Interaction promises`: what the interface must make
  true, with form delegated. Its three ASCII mockups are deleted rather than
  migrated, because they had already drifted — a product name in the header, a
  `Reply:` speaker label, a `TAP to talk` control label, none of which matched
  the design — which is precisely what a second home for the same content
  produces. A plan may plan a change to `DESIGN.md`, and the change lands
  there; no dated document supersedes it. `AGENTS.md` records the arrangement
  under How work flows and Source of truth. Accepted cost: appearance review
  now needs two files open instead of one.
- **D37 (2026-07-26) — The visible header title is `Practice`; `Wonderturn`
  lives in the document title and home-screen name.** The deleted mockups put
  the product name in the header, which was never argued. On a single-screen
  tool a brand line does no wayfinding — the title bar and installed icon
  already carry it — and it spends the header's quiet on decoration.
  `Wonderturn` remains the public product name and is still never a speaker
  name.
- **D38 (2026-07-26) — The fourth voice state is `speaking`, not `talking`.**
  `talking` collided with `Talk`, the action label on the same control, in the
  two most-read strings on the screen — and keeping status and action from
  reading as one claim is a stated design requirement. The old name came from
  feature-doc prose rather than from a decision, so the rename costs nothing.
- **D39 (2026-07-26) — Microphone permission copy belongs to `DESIGN.md`.**
  P3's four fixed responses are pinned in this plan because each is frozen
  into a committed audio clip. The permission and blocked-permission strings
  have no clip and are never spoken, so they are screen copy and are pinned in
  the design system instead. Before this entry neither document owned them,
  which left the first-run screen — the one every new user meets — with no
  approved wording at all.
- **D40 (2026-07-26) — The thinking cue advances once instead of freezing.**
  `DESIGN.md` capped the cue at a single 900ms dot sequence and then static,
  while P20 lets the wait run to a 15-second timeout. Thirteen seconds of one
  frozen word reads as a hung app to an eight-year-old, and the feature doc
  requires the cue to carry the whole wait, so the cap was a defect rather than
  restraint. The cue now makes exactly one discrete change — `Thinking` →
  `Still thinking` at ~4s — and still never loops, so the ban on breathing
  orbs, typing indicators, and indefinite pulses is untouched.
- **D41 (2026-07-26) — Design-system gaps closed by building it four times.**
  Four fresh implementers were given `DESIGN.md` alone — two on the same brief,
  so that divergence between them measured ambiguity rather than taste — and
  told to report every point the document failed to determine. Divergence is a
  better spec test than review: all four read the document as careful
  implementers and still produced different screens.

  Two findings were real defects, not preferences. `start-over` and
  `sign-in-action` pinned an exact `height: 48px` against `padding: 14px` and a
  20px line-height, which exactly fills the box at 1× and clips the label at
  200% text zoom — contradicting the document's own zoom requirement, and
  contradicting an accessibility section that calls 48px a floor. Two of the
  four builds reproduced the clipping; one silently corrected it to
  `min-height`. Every size and height is now a minimum (`minHeight`,
  `minSize`), including the talk control, which grows rather than clipping
  `Try again`. Separately, `talk-control-active` named no trigger and drew four
  different readings — a Listening fill, a `:active` press fill, an unexplained
  state class, and a declared-but-unused dead token. It is now
  `talk-control-pressed`, is the pressed fill and nothing else, and no voice
  state changes the control's color.

  Nine pins were added where the document was merely silent: the error status
  is an unfilled row with no chip, and the absence of that token is now stated
  as the rule (the notice already carries the tonal fill, and stacking two
  makes the red spectacle the design forbids); a glyph column covering all
  seven control rows, plus a `glyph` token, since the prose offered three
  glyphs for seven rows; the status-to-control gap; the transcript turn label's
  type and color; whitespace as the transcript's only separator, with
  `divider-soft` reduced to its single real use; the header's secondary line
  deleted, because `AI reply` on every turn is a better disclosure than a
  subtitle; a notice replacing the empty state rather than joining it, so the
  screen never says `Tap Talk` about the tap that just failed; the
  denied-state copy, previously owned by nobody (same hole as D39, found the
  same way); and the short-landscape arithmetic, which shows the sticky control
  zone cannot hold below ~360px of height and says what gives way instead.

  Worth repeating before any surface is called done. Accepted cost: four
  throwaway HTML builds, none of which is kept.
- **D42 (2026-07-26) — One self-hosted serif enters the design system.
  Supersedes the native-stack-only rule.** `DESIGN.md` required the native UI
  stack specifically so a font download could never join the critical path. That
  reasoning is sound and the conclusion no longer follows from it: Literata is
  self-hosted via `next/font` with `font-display: optional`, which neither blocks
  first paint nor reflows — a first visit renders in the system serif fallback and
  every later one is cached. The type system is now two-tier and the split
  carries meaning: the serif is the conversation, the native sans is the
  application. Children's books are set in serif, which serves age-neutral
  competence better than a friendly sans, and if the face never loads the design
  degrades to Georgia and still reads as intended. Bounded deliberately: one
  variable face, latin subset, no icon font and no display face. Accepted cost: a
  font asset in the repository, and a first paint that can differ from every
  subsequent one.
- **D43 (2026-07-26) — The design system gets a positive target, not just a
  fence.** Review found the four independent builds "functional but boring," and
  the cause was structural rather than a matter of taste: the document carried
  roughly thirty specific prohibitions against a single sentence of positive
  aesthetic direction, so four careful implementers all avoided everything
  forbidden and committed to nothing. Two of its own claims were also unmet —
  `canvas` was `#F7F8F5`, whose highest channel is green, while the prose
  promised "warm mineral paper" and forbade a cool neutral; and `transcript` at
  18px sat one pixel above `body` at 17px, so the screen's primary content led
  nothing.

  What changed: a new **Aesthetic intent** section with reference points and
  five screenshot-checkable commitments; warm neutrals throughout, with a new
  `plinth` tone giving the screen two planes so depth comes from tone rather
  than shadow; a widened scale where the transcript is unambiguously the largest
  text (21px against 16px body) and `meta` earns authority from tracking instead
  of size; the talk control given object quality through a hairline inner rim and
  a static Listening ring, with the ring-versus-glow line drawn explicitly — an
  instrument holds a shape, a companion moves; and the listening waveform
  promoted from an optional flourish inside the control to the Listening status
  glyph itself, as a live speech-activity cue. That last one resolves a collision the
  old text created, where a waveform and a stop glyph competed inside one 104px
  circle, and it is the design's one permitted living element precisely because
  it reflects the person's own voice rather than performing a personality.

  All contrast pairs were recomputed against the warm canvas and are recorded in
  Colors; every one still clears AA. Accepted cost: the neutrals now differ from
  anything already built, and the palette is warm enough that a cool-screened
  phone may render it more yellow than intended — worth checking on the two
  target devices.
- **D44 (2026-07-26) — The foundation follows the current Next.js defaults,
  with React Compiler deliberately enabled. Supersedes D22's no-ESLint
  choice; extends D29.** The application uses Node.js 24 LTS, the root `app/`
  directory, the default `@/*` alias, Turbopack, and Tailwind CSS 4. These are
  the current Next.js foundation defaults except for React Compiler, which is
  stable but still opt-in because it adds build time. This app enables it:
  automatic memoization removes application code and the build-time cost is
  negligible at this size.

  pnpm 10.28.0 is pinned rather than the newer pnpm 11 line because 10 is the
  newest major Vercel currently supports without an experimental Corepack
  deployment path. Node.js 24 is both the current LTS and Vercel's default.
- **D45 (2026-07-26) — Token values live in code; `DESIGN.md` keeps names,
  roles, and rules. Refines D36.** D36 made `DESIGN.md` canonical for the design
  system, which was read as canonical for everything in it, values included.
  Sharpened: it is canonical for **names, roles, relationships, and rules**, and
  code is canonical for **values**. That is not a reversal — nothing about
  one-design-system-one-document changes — but it has to be stated, or the next
  reader sees a contradiction.

  The reason is that a value in markdown is inert and a value in code is
  executable. Both value defects this project has shipped were invisible in
  prose and would have been obvious in a browser in five seconds: `start-over`
  pinned `height: 48px` with padding and line-height summing to exactly 48, so
  the label clipped at 200% zoom (D41), and `canvas` was `#F7F8F5`, whose
  highest channel is green, while the prose beside it promised warm paper and
  forbade a cool neutral (D43). No document review catches either. A typecheck,
  a build, and one look at a rendered screen catch both. `AGENTS.md` already
  bans this species of duplication — file trees, dependency versions, env
  inventories — and a token table belongs to it.

  Three kinds of number, and only two move. Primitives become `@theme` custom
  properties. Component tokens become component code, because a value used by
  one component was never a token. **Numbers that carry an argument stay in
  prose** — the 14.9:1 ink contrast, the 5.8:1 focus ring against canvas, the
  ~360px at which the control zone stops being sticky, `48px is a floor, not a
  fixed height`. Those are the reasoning, not the configuration, and stripping
  them would gut the document while technically satisfying this entry.

  Accepted cost: `DESIGN.md` stops being a standalone brief. The fresh-eye
  exercise from D41 becomes "read `DESIGN.md` and `app/globals.css`" — a
  slightly larger input, and a more honest one, since a real implementer reads
  both. That exercise is worth keeping; it has now paid for itself twice.

  Tailwind is installed as the future reuse layer for the Wonderturn design
  system, but the foundation deliberately carries no visual interpretation of
  the still-active design work. A component library is not installed
  speculatively: the MVP has native buttons, a semantic transcript, and simple
  status/notice primitives, so a library would add an abstraction before there
  is a component to buy. CSS Modules remain available for the rare rule
  utilities cannot express clearly.

  React Compiler relies on the Rules of React, which strict TypeScript does
  not enforce. ESLint therefore returns, narrowly justified by the Next.js,
  React Hooks, and compiler rules; cosmetic unused-code policy is not the
  reason it exists. The pre-commit hook from D29 now runs `lint`, `typecheck`,
  and the offline tests. Formatting remains outside the hook, while `verify`
  names all four deterministic checks explicitly.
- **D46 (2026-07-26) — The device harness becomes a durable operator
  diagnostic.** Supersedes Phase 0b's instruction to delete the browser
  harness. Testing it on Android showed that the page is useful beyond the
  one-time stack gate: it turns browser-specific voice and playback behavior
  into a structured report that can later support real-device failures.

  The stable route is `/diagnostics`. Browser, operating system, and device
  class are inferred with Bowser from the user agent rather than entered by
  hand. Reports cross a Zod-validated POST boundary and receive a server-issued
  reference. The temporary sink is one structured server-console entry; there
  is no report database, viewer, or retention system yet. Reports include the
  visible transcript and notes, so the page states that before submission and
  the eventual production route inherits the application's access gate.
  This is a narrow exception to the engineering rule against payload logging:
  the submitted report is itself the requested diagnostic output and the
  console is its temporary sink. Validation and other failure logs remain
  metadata-only.

  This does not promote spike visuals into the product design system. The
  diagnostics are an operator surface and remain semantic and visually generic
  until there is evidence that they need dedicated design treatment.
- **D47 (2026-07-26) — Speech accuracy uses fixed, comparable samples.** The
  diagnostics offer three short sentences covering everyday language, a name
  and number, and a natural question. A tester selects one, reads it aloud, and
  sees the expected text beside the browser transcript; the report carries the
  stable sample ID and the server attaches the canonical sentence.

  This deliberately avoids an automated accuracy score for now. The available
  word-error-rate package is unmaintained and untyped, and a home-grown metric
  would give a precise-looking number without enough evidence that it reflects
  the experience of a child speaking naturally. Fixed input and captured output
  provide the comparison needed for the device gate without inventing a new
  subsystem.
- **D48 (2026-07-26) — Remote STT comparison uses AI Gateway.** The July 22
  Gateway audio release makes the Phase 0 spike's earlier lack-of-STT finding
  obsolete. Diagnostics now sends one short MediaRecorder file concurrently to
  `openai/gpt-4o-mini-transcribe` and `xai/grok-stt` through the AI SDK. This
  gives two provider implementations behind the Vercel project's existing OIDC,
  observability, and spend controls without introducing two provider keys or a
  bespoke client.

  This is batch transcription, not realtime streaming: the current question is
  comparative accuracy and end-to-end response time for a completed child-sized
  sentence. The app accepts at most 2 MB, times out each provider after 30
  seconds, fails the comparison as a unit, and neither stores nor logs audio.
  The diagnostic page discloses that audio leaves the device and that the
  selected OpenAI route currently has no Gateway zero-data-retention support.
  The report may include the resulting text and timings, but never the audio.
- **D49 (2026-07-26) — Better Auth replaces the bespoke Google ID-token
  gate, with one production OAuth callback for every preview.** Supersedes
  D3's no-auth-library choice and refines D11 without changing its fixed
  180-day lifetime. Better Auth runs stateless, with no database: its
  encrypted JWE session cookie is the session store, and the application
  still checks `ALLOWED_EMAILS` on every protected request.

  The OAuth Proxy registers only
  `https://wonderturn.com/api/auth/callback/google` with Google. Production
  exchanges the authorization code and sends a short-lived encrypted result
  back to the initiating preview; a dedicated `OAUTH_PROXY_SECRET` is shared
  across production and preview deployments. Dynamic base URLs allow
  `wonderturn.com`, localhost, and an operator-configured, project-scoped
  Vercel host pattern. Broad `*.vercel.app` trust is rejected so another
  Vercel project cannot become a callback target.

  This introduces a Google client secret and acknowledges the privacy boundary
  the bespoke ID-token flow avoided: Better Auth temporarily processes and
  encrypts Google's basic account response and provider tokens, including its
  short-lived proxy payload and account cookie. The long-lived session retains
  the verified email and auth identifiers, but the provider name and photo are
  stripped before it is created. Wonderturn consumes only the email and creates
  no user, account, profile, or session record. The operator explicitly
  authorized this Phase 1 slice before Phase 0b exits; that does not waive
  Phase 0b or make Phase 1 complete before the deployed approved/denied and
  Safari-persistence checks pass.
- **D50 (2026-07-26) — The Vercel production domain is the OAuth anchor until
  a custom domain is purchased.** Supersedes only D49's `wonderturn.com`
  hostname assumption; its Better Auth, stateless-session, and OAuth Proxy
  architecture remain unchanged. Production is
  `https://wonderturn.vercel.app`, Google's sole redirect URI is
  `https://wonderturn.vercel.app/api/auth/callback/google`, and dynamic hosts
  allow that production host, localhost, and the project-scoped
  `wonderturn-*-daohoangson.vercel.app` pattern.

  A real approved account completed the full flow in Safari on production and
  `wonderturn-git-feat-mvp-daohoangson.vercel.app`. Both requests sent Google
  to the production callback, returned to the origin that initiated sign-in,
  reached the authorized empty app, and retained the session across a reload.
  Buying a custom domain later requires an explicit superseding decision plus
  coordinated Google redirect URI and environment changes; no dormant
  `wonderturn.com` compatibility is carried now.
- **D51 (2026-07-26) — Literata is a local build input, not a build-time
  download.** Refines D45's `next/font` choice. The app depends on
  `@fontsource-variable/literata` and passes its Latin, normal-style,
  variable-weight WOFF2 file to `next/font/local` with `font-display:
  optional`. This preserves the planned one-file, Latin-only reading face and
  fallback stack while keeping production builds independent of Google Fonts
  availability. `next/font/google` was rejected after the production build
  attempted seven remote subset downloads despite requesting only the Latin
  subset.
- **D52 (2026-07-26) — Phase 2 may start at the provider-independent text
  seam before the device gate exits.** Extends D49's operator-approved
  sequencing exception from the access gate to this bounded text slice. The
  implementation may absorb the classifier prompt, build `runTextTurn`, and
  wire the selected Gateway text models because those contracts do not depend
  on microphone or playback behavior. This does not waive Phase 0b, G2, or G6:
  the HTTP/audio path and interactive voice screen remain gated until their
  browser, funded-provider, voice, and cap prerequisites are resolved.
- **D53 (2026-07-26) — The current transcript shares the history-entry
  character bound.** Clarifies P20. `said` becomes the next user history entry,
  so the server caps it at the same 1,000 characters as every submitted
  history entry. A modified client cannot bypass the sitting's cost bound by
  sending one oversized current transcript. The boundary rejects the request
  rather than truncating speech invisibly; the route will map that rejection
  to P7's validation failure.
- **D54 (2026-07-26) — Talia is the single approved voice, and the fixed copy
  is frozen.** The operator approved P3's five lines and selected ElevenLabs
  Talia (`OZ0L6eISlOejga3XjDFt`). Its calm adult delivery fits the same
  age-neutral instrument for a child or an English-practicing adult without
  introducing a named on-screen character or companion framing.

  The fixed clips wait for Phase 0b's D33 model result instead of being
  generated under an arbitrary model. Bundled and ordinary speech should use
  the same voice/model pairing so a safety redirect or disclosure does not
  sound like a different persona. This resolves G6's copy and voice choices,
  not its plan-cap confirmation or the model gate.
- **D55 (2026-07-26) — Flash v2.5 is the one atomic speech model. Supersedes
  D33's conditional `eleven_v3` model branch and D54's wait to generate fixed
  clips; retains D33's direct ElevenLabs provider choice.** The operator
  selected `eleven_flash_v2_5` and confirmed the provider cap. Progressive
  synthesis is no longer part of the MVP, restoring D5's one atomic response
  while retaining the speculative clearing-check/TTS concurrency inside the
  server.

  Talia (`OZ0L6eISlOejga3XjDFt`) now generates ordinary replies and all five
  committed fixed MP3s. Requests pin English, automatic text normalization,
  stability `0.5`, similarity `0.75`, style `0`, speaker boost on, speed `1`,
  and seed `20260726`; provider defaults cannot drift the delivery silently.
  The manifest binds each approved text to the model, voice, byte length, and
  SHA-256 hash, and `verify` checks those values against the committed files.
  The operator listened to and approved the five generated deliveries before
  they were committed.
- **D56 (2026-07-26) — Safari delayed atomic playback passes; offline
  recognition is evidence, not an exit gate.** The operator confirmed that the
  diagnostic's delayed source swap plays in Safari without a second tap. That
  validates the one-tap atomic Flash path selected by D55; progressive playback
  is no longer part of the MVP.

  Offline Web Speech behavior answers whether a browser is using a remote
  vendor service, but the product never promised offline availability. It
  already discloses the browser-vendor boundary and fails closed when
  recognition is unavailable. An offline run remains useful privacy evidence,
  but neither success nor failure blocks Phase 2. Phase 0b now has one
  outstanding device gate: recognition accuracy on the kids' actual voices.
- **D57 (2026-07-26) — Phase 0b passes with low child-voice accuracy and
  network-dependent recognition. Supersedes D56's remaining accuracy gate.**
  The operator tested the kids' actual voices and accepts the observed low
  recognition accuracy for the private MVP. This is an explicit product
  tradeoff, not a claim that the recognizer met an objective score. Real family
  use remains the signal for whether server-side transcription must replace it.

  Recognition does not work offline in the tested context, confirming the
  browser-managed path depends on a network service there. That result matches
  the disclosed browser-vendor boundary and the existing fail-closed behavior;
  the product remains online-only. Together with D56's Safari delayed-playback
  pass, this closes Phase 0b and unblocks the voice pipeline.
- **D58 (2026-07-26) — The AI Gateway spend gate is resolved.** The operator
  confirmed that Vercel AI Gateway is enabled and funded with P12's planned
  `$10` monthly budget. G2 no longer blocks Phase 2. The application still
  treats an exhausted budget or any Gateway failure as P7's single fail-closed
  error state.
- **D59 (2026-07-26) — Fixed audio is embedded in the server route's build
  artifact.** The source MP3s and their text/voice/model/hash manifest remain
  the reviewable assets. `pnpm audio:fixed` also generates a base64 JSON bundle
  that `POST /api/turn` imports and parses with Zod. This preserves D5's one
  JSON response without assuming a serverless function can read Vercel's
  separately deployed `public/` directory or fetching the app's own CDN.

  The duplication is generated and verified, not a second source of truth:
  `verify` decodes every bundled value and compares it byte-for-byte with its
  committed MP3 and manifest hash. Authorization runs before request parsing,
  the allowlist is read afresh, and all validation, provider, configuration,
  and internal response failures return P7's sanitized category-only shape.
- **D60 (2026-07-26) — The server expires first at 14 seconds. Extends P20.**
  P20's client timeout remains 15 seconds. `POST /api/turn` combines the
  request signal with its own 14-second signal before calling `runTextTurn`,
  giving the route one second to turn an upstream timeout into P7's sanitized
  failure response before the browser stops waiting. Provider adapters still
  own prompt network cancellation; stale-turn rejection remains the client
  correctness boundary.
- **D61 (2026-07-26) — Localhost uses direct Google OAuth. Supersedes D49's
  localhost proxy choice only.** Production and Vercel previews retain D50's
  production-domain proxy. Local development uses a separate Google web client
  registered for `http://localhost:3000` and configures that same origin as
  Better Auth's production URL, which makes the plugin skip proxying. Safari
  completed the direct callback with the approved account and retained the
  stateless session across reload on 2026-07-26.
- **D62 (2026-07-26) — The latest intelligible interim transcript is valid
  input when listening stops. Extends P4 and D26.** Safari can display an
  interim result without promoting it to a final result before `stop()` ends
  recognition. Submitting only final results therefore turned visible speech
  such as "hello hello" into an empty-input nudge. The client now submits the
  latest displayed transcript, while still preferring each final result as it
  arrives. The classifier also pins greetings, short answers, and repetitions
  of real words to `ordinary`; `nudge` remains for genuinely content-free
  input.
- **D63 (2026-07-27) — Browser recognition exclusively owns the microphone,
  and the client timeout uses an explicit controller timer.** Real-device
  testing isolated two independent compatibility failures. On Chrome Android,
  raw `getUserMedia` capture drove the amplitude bars and Web Speech worked by
  itself, but Web Speech produced no transcript while both consumers held the
  microphone. The production screen therefore removes its parallel
  `getUserMedia`/Web Audio stream and drives an honest speech-activity cue from
  the recognizer's audio, sound, speech, and result events. This narrows the
  visual promise from raw amplitude while preserving the cue's purpose and
  gives recognition one owner of the device.

  On iPhone Safari, stopping after successful recognition produced the fixed
  client error without any `POST /api/turn` reaching Vercel. The client had
  called `AbortSignal.any()`, which WebKit did not ship until Safari 17.4. A
  plain `AbortController` plus an explicit 15-second timer preserves P20's
  timeout and cancellation semantics without that newer browser dependency.
- **D64 (2026-07-27) — Only the newest interim hypothesis is current speech.**
  Chrome Android can expose several cumulative non-final hypotheses in one
  recognition event, such as "tell", "tell me", and "tell me something".
  Concatenating them manufactured a long repetitive transcript that the child
  never said and could trigger a false `nudge`. Final results still accumulate
  across the turn, but among non-final results the latest browser hypothesis
  replaces the earlier ones.
- **D65 (2026-07-27) — Recognition results follow the Web Speech indexed-list
  contract. Supersedes D64.** `SpeechRecognitionEvent.results` is the complete
  current list for one recognition session: immutable final entries followed
  by replaceable or removable interim entries. `resultIndex` identifies the
  first changed index; it does not turn later entries into append-only text.
  The client therefore rebuilds final and interim text from index zero on every
  result event, matching the specification's continuous-recognition example.
  Only when the browser ends and the client explicitly restarts recognition
  does the latest intelligible text become a completed-session prefix.
- **D66 (2026-07-27) — OpenAI live transcription replaces Web Speech.
  Supersedes D1, D9's Web Speech candidate, D57's accuracy acceptance, and
  D62–D65's browser-result semantics.** Real Android testing continued to
  produce duplicated cumulative hypotheses after the implementation matched
  the Web Speech indexed-list contract. The operator also rejected the low
  local-STT accuracy accepted in D57. Provider-managed streaming is now the
  smaller and more reliable product path than accumulating more
  browser-specific recognition behavior.

  The production screen streams one microphone source as 24 kHz mono PCM to
  `openai/gpt-realtime-whisper` through AI Gateway, with language `en`,
  `medium` transcription delay, and manual finalization when the person taps
  `Done`. Streaming parts update the visible transcript; the provider's final
  text alone enters `POST /api/turn`. The same PCM source drives honest RMS
  level bars, preserving D63's single-owner finding while superseding its
  recognizer-event cue.

  An allowlisted Better Auth session may mint a 60-second Gateway client secret
  scoped to that model. The browser connects directly to Gateway/OpenAI with
  the short-lived token; no long-lived provider credential reaches the device,
  and Wonderturn does not proxy, log, or store microphone audio. AI Gateway's
  existing budget now covers transcription as well as text work. Any token,
  socket, provider, or finalization failure fails closed into the ordinary
  content-free error state.
- **D67 (2026-07-27) — The first transcription latency pass changes transport
  timing, not product semantics. Extends D66.** Real preview use proved the
  OpenAI path reliable but slower than the operator wants. The experiment
  changes `gpt-realtime-whisper` delay from `medium` to `low`, starts
  microphone permission and token minting concurrently, and halves PCM capture
  chunks from 4096 to 2048 samples (about 171ms to 85ms at 24 kHz). These are
  deliberate latency-for-accuracy and batching tradeoffs to validate on both
  family phones; the final provider transcript still owns submitted speech.

  Safari's already-proven delayed-playback unlock remains, but its silence is
  now a preloaded, immutable static WAV under `public/` rather than a dynamic
  diagnostics-function request with a cache-busting query. This removes
  backend work and makes later taps a cache hit without changing playback
  authorization semantics.
- **D68 (2026-07-27) — Latest-turn repair is explicit undo, not transcript
  inference. Extends P1 and P8.** Live transcription accuracy is acceptable
  but not infallible, and the prior screen made recognized wording final as
  soon as the person tapped `Done`. The newest completed `You` turn therefore
  carries `Say again` until later listening begins. Activating it invalidates
  pending work, stops playback, removes that human turn and its zero or one
  dependent AI reply from client history, and opens the ordinary listening
  path immediately.

  Repair does not retain or re-transcribe audio, ask for confirmation on every
  successful turn, infer intended words from conversation history, expose
  alternatives, or edit older turns beneath replies built from them. Those
  choices preserve the fast happy path, the no-storage boundary, and honest
  model context while giving the child one visible way to recover from a
  mishearing.
- **D69 (2026-07-27) — Recording readiness becomes a whole-screen state, and
  controls stay in the viewport. Supersedes D38's five-state count, D41's
  no-state-color conclusion, and D68's inline `Say again` presentation.**
  Real use with the kids exposed three connected failures: the client claimed
  `Listening` before transcription setup was ready, the stop action was easy
  to forget, and repair inside the scrolling transcript was easy to miss.

  Setup and provider finalization are now explicit `starting` and `finishing`
  states around actual `listening`. A short Web Audio cue finishes before PCM
  capture begins; only then does the screen show `Listening — speak now`, a
  recording-red talk control, and a pulsing red edge wash. Three seconds of
  below-threshold audio after speech uses the same finalization path as `Done`;
  the 60-second cap remains. Reduced motion holds the wash static. The red
  treatment is deliberately redundant with text, sound, level bars, glyph, and
  control label, never a color-only state.

  The app shell is one dynamic viewport tall with header and control rows
  fixed in its grid; transcript content alone scrolls and follows the newest
  turn only when the reader was already near the bottom. A reserved 48px row
  keeps the main control stationary and exposes the latest-turn repair as the
  bordered `That's not what I said` action. These observed usability failures
  justify the functional gradient, pulse, recording-state color, and extra
  lifecycle states that the earlier calm-recorder design rejected.
- **D70 (2026-08-08) — Current-prompt verification precedes child-scaffolding
  calibration.** Real use found that an intelligible child who says they do
  not know what to discuss, or has not expressed a thought clearly, receives
  too little encouragement or direction. The current classifier explicitly
  routes `i dont know` to the fixed unheard-input nudge, so this is an observed
  contract failure rather than a request for generally friendlier prose.

  Phase 3 is split without weakening its safety exit. Phase 3a migrates the
  existing safety fixtures and register asks, adds labelled feedback probes,
  runs them against the production seam with the current prompts unchanged,
  and deletes the absorbed spike. Phase 3b then updates classifier semantics
  and reply prompting against that recorded baseline. It keeps genuinely
  empty or inaudible recognition on the fixed nudge path, uses no model judge,
  and does not add engagement hooks or generic praise. This changes durable
  intent, so the feature doc's product principle and register outcome change
  alongside the plan before prompt implementation begins.
- **D71 (2026-08-08) — The current-prompt baseline is evidence, not a prompt
  tuning pass. Extends D70.** Phase 3a's first durable run passes all 25
  outcome fixtures after replacing one meta-labelled safe candidate with a
  natural safe sentence; the production checker was unchanged. Its register
  pass reproduces the user feedback on all four stuck or unclear probes: each
  lands on the fixed unheard-input nudge, including the explicit request
  "give me something easy to talk about." It also exposes two older acceptance
  misses: the faith-family ask and the cross-session-memory ask both end in the
  generic redirect rather than a natural family deferral or an honest memory
  limitation.

  These observations are committed in
  [`docs/eval/20260808_phase3a_current_prompt.md`](../eval/20260808_phase3a_current_prompt.md).
  Phase 3a does not change a production prompt to make the baseline prettier.
  Phase 3b owns diagnosis and correction of all three register-failure groups,
  with the 25 discrete safety outcomes rerun after every change.
- **D72 (2026-08-08) — Local model-latency benchmarking is removed.
  Supersedes D30's requirement to migrate the interleaved latency method.**
  The Phase 0 scripts were useful for choosing an initial direction, but their
  local network path does not represent Vercel's deployed region, the phone's
  transcription path, server orchestration, synthesis, or playback. Keeping a
  polished local command would make a non-product measurement look
  authoritative.

  Phase 3a therefore migrates only the labelled outcome fixtures and register
  asks. The old measurements and their methodological caveats remain as
  historical evidence in the Phase 0 findings document. Product latency is
  verified only through Phase 4's deployed ten-turn voice script on both
  target phones; future model comparisons must use that same deployed path.
- **D73 (2026-08-08) — Phase 3b begins with deliberately red outcome cases
  and a human review gate.** The proposed contract keeps genuinely empty or
  content-free input on `nudge`, while seven intelligible cases expect a
  cleared `reply`: bare uncertainty, a request for help choosing a topic, an
  explicit easy-topic request, an incomplete but meaningful thought,
  uncertainty with current-session context, the faith-family deferral, and the
  cross-session-memory limitation.

  These cases run through the unchanged production seam first. Their failure
  is the intended artifact for review, not a reason to modify a prompt in the
  same slice. No classifier, reply, clearing, fixed-copy, or audio change is
  authorized until a human approves both the inputs and their expected outcome
  kinds. The first run fails four uncertainty cases as `nudge` instead of
  `reply`; the easy-topic, faith-family, and memory cases pass as `reply` in
  that run despite producing `nudge` or `redirect` in the Phase 3a register.
  That variation is evidence to keep the three cases, not evidence that their
  current prose is accepted. The review record is
  [`docs/eval/20260808_phase3b_red_cases.md`](../eval/20260808_phase3b_red_cases.md).
- **D74 (2026-08-08) — Register eval grades the prose explicitly, by a human.
  Extends D21, D29, and D73.** Outcome-kind assertions can prove that an
  intelligible child reaches generation, but they cannot prove that the reply
  is understandable, concrete, encouraging, or useful. Each fixed register
  case therefore carries an explicit rubric. `pnpm register` prints the
  expected kind, routing result, word count, question marker, final cleared
  response, and every applicable criterion as an unchecked scorecard.

  A row passes only when routing matches and a human checks every applicable
  criterion. The shared criteria cover plain child-readable language, focus,
  a warm encouraging tone, absence of generic praise or engagement pressure,
  and case-specific needs such as concrete explanation, neutral family
  deferral, honest memory limits, acknowledging uncertainty, offering two or
  three concrete choices, a few-word next step, one necessary clarification,
  and no invented meaning.
  No model judge or readability heuristic is added: both would turn a
  subjective proxy into an automatic authority, while the real family reviewer
  is available and is the acceptance signal the feature doc already pins.
- **D75 (2026-08-08) — A separate-family LLM judge automates register grading.
  Supersedes D74 and partially supersedes D21 and D29.** Repeated human scoring
  is too costly for prompt iteration, while outcome-kind assertions cannot
  evaluate child suitability, encouragement, or scaffolding. The fixed asks
  and explicit rubric remain human-authored and receive one review at the Phase
  3b gate, but every subsequent `pnpm register` run grades them automatically.

  The operator pins GPT-5.6 Luna to judge replies produced by Gemini 3.5 Flash
  Lite, so the writer and grader do not share a model family. One structured
  call per case returns an exact pass/fail verdict and short reason for every
  applicable criterion; Zod rejects missing, unknown, or extra verdicts. The
  command collects all failures, prints every row, and exits red when routing
  or any rubric item fails. The judge is deliberately outside `verify`, CI,
  and commit hooks because it uses the network, costs money, and can vary. Its
  verdicts are an iteration signal rather than a safety boundary; the
  deterministic outcome fixtures and eventual sessions with the kids remain
  independent evidence.
- **D76 (2026-08-08) — Human review narrows Phase 3b to six active behaviours
  and defers cross-session memory. Supersedes D73's seven-case active scope and
  D74's two-or-three-choice detail.** Bare uncertainty and an explicit lack of
  topic must receive at least one concrete new topic. An explicit easy-topic
  request passes with two to four concrete choices, so the observed four-choice
  reply is accepted. Contextual uncertainty may continue the current topic or
  suggest another one. An incomplete thought is tested only after an assistant
  prompt and must trigger a simpler rewording of that prompt rather than a
  generic retry. The observed faith-family reply is approved and remains a
  regression case.

  The cross-sitting-memory ask is marked deferred and skipped by `pnpm
  register`; its Phase 3b outcome fixture is removed. Implementing real recall
  requires the cross-session memory and profile feature that the feature doc
  already places out of MVP scope. The independent clearing fixture still
  rejects invented memory and relationship claims, so deferral does not loosen
  the current safety guarantee. Stable `REG-01` through `REG-14` IDs make these
  decisions addressable in review even when a row is skipped.
- **D77 (2026-08-08) — Phase 3b routes intelligible uncertainty to generation
  and uses structured checker output. Extends D76.** The classifier now reserves
  `nudge` for content-free input and routes an intelligible statement of
  uncertainty through the ordinary reply path. The reply prompt explicitly
  acknowledges stuckness, supplies concrete new or current-topic directions,
  and gives simpler wording of the immediately previous prompt priority over
  changing the topic. General explanation rules keep necessary terms defined,
  curiosity replies lively, sensitive replies gentle, adult language-learning
  examples age-neutral, and advice endings actionable. The approved neutral
  faith-family deferral remains safe.

  Live evaluation exposed occasional free-text classifier and clearing output
  outside their enum contracts. Those two small checks therefore use AI SDK
  structured output backed by their existing Zod schemas, then return the
  parsed field to the unchanged text-turn seam. This is boundary parsing, not
  recovery: malformed provider output still fails fast. The final evidence is
  30/30 live outcome fixtures, 13/13 active register routes, 81/81 applicable
  GPT-5.6 Luna criteria, and 71/71 offline tests; `REG-09` remains deferred.
- **D78 (2026-08-08) — Classifier examples are held apart from evaluation
  inputs. Extends D77.** Exact or near-exact examples can make a passing route
  demonstrate recall of prompt wording instead of category generalization. The
  classifier therefore keeps its reviewed semantics without carrying examples;
  ordered category definitions express the contract directly. The audited
  outcome and register inputs remain unchanged as holdouts.

  After removing the overlapping examples, the production seam still passes
  30/30 live outcome fixtures—including both bare-help disclosure checks—and
  all 13 active register routes plus 81/81 GPT-5.6 Luna criteria. This pass
  strengthens the evidence without changing the Phase 3b contract.
- **D79 (2026-08-08) — Prompt contracts use short, positive, route-local
  instructions. Extends D77 and D78.** Three independent fresh-eye reviews
  converged on removing classifier examples, ordering overlapping routes,
  expressing reply requirements as observable sentence shapes, and separating
  current-turn cooperation from personal relationship or cross-sitting-memory
  claims. The classifier, reply, and clearing prompts now contain 106, 286, and
  93 words respectively, with zero direct `must not`, `avoid`, `do not`,
  `never`, `cannot`, or `without` instructions. The reply prompt remains shorter
  than its 389-word starting point while retaining the route-local detail the
  writer needed for stable child scaffolding.

  Classifier, writer, and clearing calls use temperature zero. The register
  judge instruction is also shorter and treats payload fields as quoted
  evidence. The final production seam passes 30/30 live outcome fixtures, all
  13 active register routes and 81/81 GPT-5.6 Luna criteria, plus 71/71 offline
  tests; `REG-09` remains deferred.
