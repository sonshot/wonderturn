# Voice Practice Tool MVP — Implementation Plan

Feature doc: [`docs/feat/20260725_voice_practice_tool_mvp.md`](../feat/20260725_voice_practice_tool_mvp.md)

## Status

Draft. No durable application code is committed yet.

Phase 0a establishes the durable repository foundation. Phase 0b is a
throwaway device spike whose result can invalidate the application stack;
nothing from Phase 1 onward should be built until it passes.

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
| Speech in | Web Speech API, browser-managed; processing may be local or use the platform vendor |
| Models | Vercel AI Gateway via AI SDK |
| Reply | Claude Sonnet 5 |
| Input classification + clearing checks | Claude Haiku 4.5 |
| Speech out | OpenAI TTS via AI Gateway (beta audio lane) |
| Auth | Google sign-in, verified once; fixed 180-day signed httpOnly cookie thereafter |
| Storage | None — no database, no client persistence |
| Validation | Zod |
| Spend ceiling | AI Gateway budget (provider-native, not app code) |
| Package manager | pnpm, version pinned in `packageManager` |
| Lint and format | ESLint flat config + Prettier |
| Git hooks | Husky |
| CI | GitHub Actions |
| Unit and contract tests | Vitest |
| Text evals and red teaming | Promptfoo, through a custom TypeScript provider |
| Eval judge | `openai/gpt-5.4-mini` through AI Gateway, separate from the reply model |
| Observability | Vercel AI Gateway + Vercel Observability; no custom telemetry backend |

The app is stateless. The client holds the conversation in memory and sends
it with each turn; nothing persists anywhere, which is the no-storage stance
expressed in the wire format rather than merely promised.

## Prerequisites and external gates

| | Gate | Owner | Blocks |
| --- | --- | --- | --- |
| G1 | Provider legal and policy review | Son | Access beyond private family use; not this version (D12) |
| G2 | Vercel account with AI Gateway enabled, credits funded, app and eval budget ceilings set | Son | Phase 2 |
| G3 | Google OAuth client ID for the sign-in button | Son | Phase 1 |
| G4 | Deployment URL — Vercel subdomain is sufficient for v1 | Son | Phase 5 |
| G5 | Out-of-band alert channel (ntfy topic or Telegram bot) | Son | Phase 5 |

G1 is deliberately deferred for the private, family-only first version. It
does not block implementation or internal use, but it must be resolved before
access expands beyond the family.

## Pinned semantics

Correctness points the feature doc deliberately left open, or where an
obvious implementation would be wrong.

- **P1 — Reveal is atomic.** A turn produces exactly one outcome, revealed
  once. Speculative generation and synthesis may run ahead of their checks,
  but discarded work never reaches the client in any form (D4).
- **P2 — Four outcome kinds.** `reply`, `redirect`, `disclosure`, `nudge`.
  Genuinely empty recognition produces `nudge` before the pipeline. For
  non-empty speech, precedence is `disclosure` → `nudge` → `redirect` →
  `reply`. Anything else is a non-200.
- **P3 — Disclosure is fixed.** A recognized disclosure returns this
  operator-authored text: "That sounds important. Please tell a grown-up you
  trust, like a parent, teacher, or another family member, so they can help
  you." Matching pre-generated audio is bundled with the app. This outcome
  needs no reply generation, clearing call, or runtime TTS.
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
- **P9 — Interrupted playback does not truncate history.** The full cleared
  reply stays in the client's history, because it was shown whole before a
  word was spoken.
- **P10 — Obsolete work never commits.** Starting over or beginning a new
  turn invalidates unfinished earlier work. Cancellation is best-effort;
  correctness comes from refusing to render, retain, or play a result for an
  obsolete turn.
- **P11 — Session lifetime is fixed.** The signed cookie lasts 180 days from
  issuance and is not extended by activity. It is `Secure`, `HttpOnly`,
  `SameSite=Lax`, `Path=/`, and has no `Domain`. Expiry returns to sign-in;
  allowlist removal denies the next protected request once the updated env
  configuration is deployed.
- **P12 — Spend is bounded by one Gateway key.** The app uses a dedicated
  AI Gateway key with a $10 monthly budget and no automatic top-up. A request
  already accepted by the Gateway, including the request that crosses the
  budget, may finish; later requests fail. Concurrently accepted work may
  also finish.
- **P13 — Text behaviour has one execution seam.** `runTextTurn` owns input
  classification, candidate generation, precedence, and clearing. It accepts
  an optional candidate-preparation callback: production supplies TTS so it
  can run beside clearing; text evals omit it and receive only
  `{ kind, text }`. Fixed outcome audio is attached outside this seam. The
  HTTP route and eval provider both call this function, so evals cannot drift
  into a second implementation of the product.
- **P14 — Evals use an off-the-shelf runner.** Promptfoo owns fixtures,
  assertions, model grading, red-team generation, latency measurement,
  reports, and CI exit status. A thin TypeScript provider is the only custom
  integration: it calls P13 without candidate preparation and serializes
  `{ kind, text }`. Vitest remains responsible for deterministic code
  contracts and forced dependency failures.
- **P15 — Observability is platform-native.** AI Gateway owns model/provider
  request volume, latency, token, and spend views; Vercel owns request and
  function visibility. App logs and alerts contain only failure category,
  endpoint, and status. No transcript, custom metrics service, trace vendor,
  or product analytics is added in v1.
- **P16 — Evals have a separate spend boundary.** Text evals, red teaming,
  benchmarks, and the judge use a dedicated Gateway key with a $5 monthly
  budget and no automatic top-up. The app key is never present in the eval
  process, so a test run cannot consume production's P12 ceiling.
- **P17 — Verification has fast local and expensive remote lanes.** The
  deterministic `pnpm verify:fast` runs Prettier check, ESLint with zero
  warnings, TypeScript type-checking, and Vitest. Husky runs that whole
  command before every commit. It performs no network or model calls.
  GitHub Actions repeats the fast lane and owns Promptfoo evals, red teaming,
  and text benchmarks with P16's secret; none of those expensive checks run
  from the pre-commit hook.

## Phases

### Phase 0a — Repository foundation

Scaffold the durable project before feature code:

- Next.js App Router and strict TypeScript, installed with the pinned pnpm
  version and committed lockfile.
- ESLint flat config using the Next.js rules, `eslint-config-prettier` to
  disable formatting conflicts, Prettier, Vitest, and Husky.
- Package scripts:
  - `format` — Prettier write.
  - `format:check` — Prettier check.
  - `lint` — ESLint across the repository with zero warnings allowed.
  - `typecheck` — `tsc --noEmit`.
  - `test` — Vitest in non-watch mode.
  - `verify:fast` — all four deterministic checks above.
  - `eval:text`, `eval:redteam`, and `bench:text` — added when their
    Promptfoo configuration lands in Phase 4.
- A Husky pre-commit hook that runs only `pnpm verify:fast`. The hook fails
  on the first bad command and never installs, downloads, or calls a model.
- A GitHub Actions CI workflow for pull requests and branch pushes. Its
  required `quality` job performs a clean `pnpm install --frozen-lockfile`,
  then `pnpm verify:fast`.

**Exit:** a deliberately malformed, unformatted, ill-typed, and failing-test
change is rejected by the appropriate command; the pre-commit hook runs the
complete fast lane; and the same lane passes in GitHub Actions.

### Phase 0b — De-risk on real devices

Throwaway code, deleted afterwards. Two iOS Safari risks and one latency
question, all in one sitting on the two phones the family uses. Run locally
behind a `cloudflared` quick tunnel; nothing is deployed.

1. Web Speech API: interim results, restart-on-silence behaviour, accuracy
   on the kids' actual voices, and the observed local-or-vendor processing
   boundary on each target browser.
2. Audio unlock: `play()` called in the tap handler, `src` swapped in ~1.5s
   later, confirmed to actually play.
3. Measured round-trip for one Gateway call to Haiku and one OpenAI TTS
   synthesis, to confirm the budget in Phase 2 is real.

**Exit:** both browser behaviours work on iOS Safari and Android Chrome,
and the measured legs fit the timeline below. Any failure sends us back to
Deepgram streaming on a container host before further work.

### Phase 1 — Access gate

Google sign-in, ID token verified server-side once for signature, issuer,
audience, and expiry, with the sign-in CSRF value checked. A P11 cookie is
then issued without sliding refresh. The allowlist is read from env and
checked on every protected request (P6). Denied accounts get the plain
refusal; nothing else exists yet.

Cookie survival under Safari's ITP is observed here, on the deployment's own
stable origin, rather than spiked in Phase 0b (D15).

**Exit:** approved account reaches an empty talk screen; a real non-approved
account cannot, verified against the deployed app.

### Phase 2 — Turn pipeline

`POST /api/turn` accepting `{ history, said }` and returning
`{ kind, text, audio }`, with generated or bundled audio returned base64.
The route calls P13's `runTextTurn`; there is no second text pipeline hidden
inside the HTTP handler.

- Genuinely empty recognition short-circuits to `nudge` before any model
  call (P4).
- For non-empty speech, input classification and candidate reply generation
  start together. A `disclosure` or `nudge` classification discards the
  candidate and returns its fixed text and bundled audio (D4).
- For `ordinary`, the clearing check and TTS start together. A clearing
  rejection discards the speculative audio and returns the fixed redirect
  with bundled audio. Only a clearing pass plus successful TTS releases the
  candidate reply (D4). P13's candidate-preparation callback is the seam
  that permits this parallel TTS without making text evals synthesize audio.
- A required check or ordinary-reply TTS failure produces P7's single error
  shape; losing speculative branches are cancelled where practical and
  always discarded.

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

**Exit:** every outcome kind is reachable through both `runTextTurn` and
`curl`, including short disclosures and a forced clearing rejection that
discards completed TTS. Their `{ kind, text }` results match. Each
required-check and ordinary-TTS failure produces the one error shape.

### Phase 3 — Talk screen

One layout, all states: idle, microphone prompt, listening, thinking,
talking, nudge, redirect, disclosure, interrupted, error. Transcript above,
control anchored low, header start-over. Barge-in stops playback and starts
listening (P9). A client turn identifier enforces P10; request cancellation
only saves work.

**Exit:** every state is reachable by hand on a phone. With a deliberately
delayed turn, starting over and starting a new turn both prevent the stale
text and audio from appearing.

### Phase 4 — Safety verification

Promptfoo calls `runTextTurn` directly through P14's TypeScript provider.
These runs use text fixtures and real configured text models, with no
browser, microphone, speech recognition, TTS, or HTTP route. Both the system
under test and the judge use P16's eval-only Gateway key.

- Curated adversarial fixtures against the clearing check.
- Disclosure fixtures, including one where redirect could also have fired
  and short phrases such as "help me."
- Register fixtures spanning the youngest user and the English-practicing
  adult, scored with Promptfoo `llm-rubric` assertions. The judge model and
  rubric text are pinned in the committed config.
- A small, pinned Promptfoo red-team configuration for relevant prompt
  injection and unsafe-output categories; no default everything-scan.
- Text latency assertions run with Promptfoo caching disabled. They measure
  the text decision pipeline only, not speech or device latency.
- Vitest forces the input classifier, clearing check, and ordinary TTS to
  fail separately and verifies the one failure shape and that nothing is
  committed.

Committed fixtures contain synthetic text only. Promptfoo config, fixtures,
and assertion thresholds are versioned; raw HTML/JSON reports are ignored.
The package scripts are `pnpm eval:text`, `pnpm eval:redteam`, and
`pnpm bench:text`.

Add GitHub Actions workflows using the eval-only Gateway secret:

- `eval:text` is added to the CI workflow as a required pull-request job
  depending on the `quality` job.
- `eval:redteam` runs by manual dispatch and is required for the Phase 4 exit
  and before family calibration, not for every commit.
- `bench:text` runs by manual dispatch with Promptfoo caching disabled. Its
  result is retained as a comparison artifact, not used as a noisy shared-CI
  latency gate.
- Workflow concurrency cancels an older run for the same branch so obsolete
  commits do not keep spending.

**Exit:** deterministic assertions all pass, every model-graded fixture meets
its declared threshold, and all three commands run successfully in their
GitHub workflows after any persona, classifier, clearing, or model change.

### Phase 5 — Production hardening

Deploy, then verify against the deployed platform rather than the code:
Vercel runtime logs and AI Gateway observability hold no transcript text or
audio, with Gateway content logging configured off. Alert channel wired for
category and endpoint only. The dedicated Gateway key has P12's budget and
automatic top-up disabled. A deliberately tiny test budget proves the
crossing request may complete and the next request is rejected before new
provider work begins. AI Gateway's built-in views provide request volume,
model/provider, latency, token, and spend visibility; no custom dashboard or
telemetry store is built.

**Exit:** a real conversation leaves no content in any log surface, and an
induced failure reaches the phone.

### Phase 6 — Register calibration

Real sessions with the kids; tune the persona against the Phase 4 suite
until Outcome 6 holds. Expect several passes.

**Exit:** the feature doc's register outcome confirmed by real use, not
judged output alone.

## Definition of done

Each feature-doc acceptance outcome, with where it is proven.

Phase 0a's repository checks are a prerequisite for every outcome below:
the pre-commit hook and GitHub quality workflow both pass `verify:fast`, and
model-backed checks run only in GitHub.

| Outcome | Verified by | Phase |
| --- | --- | --- |
| 1. Access is closed | Real non-approved account denied; approved session survives a restart; removing an authenticated account denies its next request after the env update is deployed | 1, 5 |
| 2. Nothing unchecked reaches the person | Promptfoo adversarial suite against `runTextTurn`; Vitest commit-gate contracts | 4 |
| 3. Disclosures land | Promptfoo disclosure suite incl. precedence and short phrases; bundled text/audio integration check | 4 |
| 4. Failing closed works | Vitest forces input classifier and clearing check unavailable separately | 4 |
| 5. Feels like a conversation | Promptfoo text latency benchmark plus ten-turn voice script on both phones | 4, 5 |
| 6. Register fits both ends | Promptfoo model-graded register suite plus real sessions | 4, 6 |
| 7. Nothing is retained by us | Vercel + Gateway log inspection after a real conversation | 5 |
| 8. Awkward moments are gentle | Manual: nudge, interruption, barge-in; delayed stale results after start-over/new turn | 3 |
| 9. Works on real devices | Both phones, incl. permission denial and rapid tapping | 0b, 5 |
| 10. Breakage is visible | Induced failure reaches the alert channel | 5 |
| 11. Doesn't pretend to remember | Part of the register suite | 4 |
| 12. Spend ceiling holds | Tiny Gateway budget: crossing request may finish; next request rejected before new provider work | 5 |

No phase is deployable while one of its MVP gates is open. G1 is a future
gate on expanding access, not an MVP gate.

## Resolved doc alignment

The feature doc is updated alongside this plan: browser-managed speech may
involve the platform vendor; credentialed and paid calls remain server-side;
provider legal and policy review is deferred for the private family version;
the session window is fixed; and disclosures use bundled text and audio.
The superseding Decision Log entries below preserve the earlier choices they
replace.

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
