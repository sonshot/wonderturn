# Voice Practice Tool MVP — Implementation Plan

Feature doc: [`docs/feat/20260725_voice_practice_tool_mvp.md`](../feat/20260725_voice_practice_tool_mvp.md)
Diagnostics feature doc: [`docs/feat/20260726_device_diagnostics.md`](../feat/20260726_device_diagnostics.md)

## Status

Phase 0a is complete. Its frozen install, deterministic verification lane,
production build, and local root-route smoke check pass on Node.js 24.
Phase 0b's browser checks remain open.

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
| Runtime | Node.js 24 LTS |
| Host | Vercel |
| Styling | Tailwind CSS 4; CSS Modules only where utilities are insufficient |
| React optimization | React Compiler |
| Speech in | Web Speech API, browser-managed; processing may be local or use the platform vendor |
| Models | Vercel AI Gateway via AI SDK |
| Reply | `google/gemini-3.5-flash-lite` (D31) |
| Input classification + clearing checks | `anthropic/claude-haiku-4.5` (D32) |
| Speech out | ElevenLabs, called directly (D33) |
| Auth | Google sign-in, verified once; fixed 180-day signed httpOnly cookie thereafter |
| Storage | None — no database, no client persistence |
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
once Phase 3's fixtures and register asks exist, because that is the first
point where a swap can be judged on evidence instead of on a smoke test. The
Gateway is what keeps this cheap: each row is a model string, so revisiting
is a config change and a re-run, not a refactor. Treat a row that has
outlived its evidence as a bug in this table, not as settled architecture.

## Prerequisites and external gates

| | Gate | Owner | Blocks |
| --- | --- | --- | --- |
| G1 | Provider legal and policy review | Son | Access beyond private family use; not this version (D12) |
| G2 | Vercel account with AI Gateway enabled, credits funded, budget ceiling set | Son | Phase 2 |
| G3 | Google OAuth client ID for the sign-in button | Son | Phase 1 |
| G4 | Deployment URL — Vercel subdomain is sufficient for v1 | Son | Phase 4 |
| G5 | Out-of-band alert channel (ntfy topic or Telegram bot) | Son | Phase 4 |
| G6 | ElevenLabs account with a synthesis-scoped key, a plan cap set, and a chosen voice | Son | Phase 2 (D33) |

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
  Genuinely empty recognition produces `nudge` before the pipeline. For
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

  The redirect, nudge, and error wording is a first draft and needs operator
  sign-off before the clips are generated; unlike a prompt, a bundled clip is
  expensive to change your mind about.

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
  issuance and is not extended by activity. One absolute deadline, no sliding
  window. Expiry returns to sign-in; allowlist removal denies the next
  protected request once the updated env configuration is deployed.
- **P12 — Spend is bounded by two provider caps.** The app uses a dedicated
  AI Gateway key with a $10 monthly budget and no automatic top-up. A request
  already accepted by the Gateway, including the request that crosses the
  budget, may finish; later requests fail. Concurrently accepted work may
  also finish. `test:live` and `register` draw on this same key: D21 deleted
  the eval-only key along with the harness that justified it, so test spend
  and family spend share one ceiling.

  Now sized, from spike measurements (D34). Language-model work is about
  $0.0005 per turn on the chosen models, so $10 buys roughly 20,000 turns —
  far more than this family will use, and not the binding constraint.
  **Speech is 80–90% of per-turn cost**, at roughly $0.002–0.003 for 250
  characters, and it sits outside the Gateway entirely (D33). The real
  ceiling is therefore the ElevenLabs plan, which needs its own cap set to
  fail closed the same way. Two ceilings, both provider-native, still no app
  code.
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
  itself after 60 seconds, routed through the ordinary stop path so it never
  reads as a failure. The request schema caps history at 20 turns and each
  entry at 1,000 characters, with the oldest turns dropped client-side. This
  is a cost bound as much as a latency one: stateless re-send makes token
  cost quadratic in turn count, so one long happy session is the realistic
  way P12's ceiling gets hit. The wait is bounded too: the client fetch
  carries `AbortSignal.timeout(15_000)`, and the timeout resolves to P7's
  one failure shape, so the thinking cue cannot run forever.

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
  - `test:live` — the model-backed outcome fixtures, added in Phase 3. Never
    part of `verify`, never run by a hook or by CI.
  - `register` — the register asks, dumped for reading, added in Phase 3.
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

Run locally behind a `cloudflared` quick tunnel on the two phones the family
uses; nothing is deployed. The browser harness begins here, then remains as the
durable `/diagnostics` operator surface described by D46.

The latency leg is **complete** — measurements, model selection, and the
register comparison are recorded in
[`20260726_phase0_spike.md`](20260726_phase0_spike.md), with its harness
committed under `spike/` and absorbed per D30. What remains is the browser
behaviour, which no measurement from a laptop can answer.

1. Web Speech API: interim results, restart-on-silence behaviour, accuracy
   on the kids' actual voices, and the observed local-or-vendor processing
   boundary on each target browser.
2. Audio unlock: `play()` called in the tap handler, `src` swapped in ~1.5s
   later, confirmed to actually play.

**Exit:** both browser behaviours work on iOS Safari and Android Chrome.
Any failure sends us back to server-side speech recognition on a container
host before further work.

The diagnostic surface itself is complete when it infers the device from the
user agent, preserves the browser checks above, validates direct submissions at
the server boundary, and returns a report reference. Its temporary sink is the
server console; persistent storage remains out of scope.

### Phase 1 — Access gate

Google sign-in, ID token verified server-side once for signature, issuer,
audience, and expiry, with the sign-in CSRF value checked. A P11 cookie is
then issued without sliding refresh. The allowlist is read from env and
checked on every protected request (P6). Denied accounts get the plain
refusal; nothing else exists yet.

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

`POST /api/turn` accepts `{ history, said }` — Zod-parsed with P20's bounds —
and returns `{ kind, text, audio }`, with generated or bundled audio returned
base64. The route calls P13's `runTextTurn`; there is no second text pipeline
hidden inside the HTTP handler.

- Genuinely empty recognition short-circuits to `nudge` before any model
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

The screen is one layout with **five** states: idle, listening, thinking,
speaking, error (D38). The others named in the feature doc are not states —
`nudge`, `redirect`, and `disclosure` are three strings arriving through the
`speaking` path, `interrupted` is `idle` after `pause()`, and the microphone
prompt is `idle` with a different label. Composition, state presentation, and
on-screen copy come from `DESIGN.md` and are not restated here (D36). Barge-in
stops playback and starts listening. A client turn identifier enforces P1;
request cancellation only saves work.

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
delayed turn, starting over and starting a new turn both prevent the stale
text and audio from appearing.

### Phase 3 — Safety verification

One Vitest file of model-backed outcome fixtures calling `runTextTurn`
directly through P13, with no browser, microphone, speech recognition, TTS,
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

If any later work compares model latency, it must interleave providers and
randomize order per round, the way `spike/bench-rr.mjs` did. Measuring one
provider's calls in a block and then the next confounds provider with
time-of-run, and produced two rankings during the spike that had to be
retracted.

**Exit:** the offline contract tests pass in `verify`, `pnpm test:live`
produces the expected `kind` for every fixture, and `spike/` no longer
exists.

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
output between sessions; re-run the Phase 3 `kind` fixtures after each change
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
| 2. Nothing unchecked reaches the person | `test:live` adversarial fixtures plus injected known-bad candidates against `runTextTurn`; offline commit-gate contracts | 3 |
| 3. Disclosures land | `test:live` disclosure fixtures incl. precedence, short phrases, and false positives; bundled text/audio integration check | 3 |
| 4. Failing closed works | Offline Vitest forces input classifier, clearing check, and ordinary TTS unavailable separately | 3 |
| 5. Feels like a conversation | Ten-turn voice script on both phones, against the bar as written; median at risk pending the Vercel timing measurement (D35) | 4 |
| 6. Register fits both ends | `pnpm register` asks read by the operator after any persona change, plus real sessions with the kids | 3, 5 |
| 7. Nothing is retained by us | Vercel + Gateway log inspection after a real conversation | 4 |
| 8. Awkward moments are gentle | Manual: nudge, interruption, barge-in; delayed stale results after start-over/new turn | 2 |
| 9. Works on real devices | Both phones, incl. permission denial and rapid tapping | 0b, 4 |
| 10. Breakage is visible | Induced failure reaches the alert channel | 4 |
| 11. Doesn't pretend to remember | The "what do you remember from last time?" ask in `pnpm register` | 3 |
| 12. Spend ceiling holds | Tiny Gateway budget: crossing request may finish; next request rejected before new provider work | 4 |

G1 is a future gate on expanding access, not an MVP gate.

## Resolved doc alignment

The feature doc is updated alongside this plan: browser-managed speech may
involve the platform vendor; credentialed and paid calls remain server-side;
provider legal and policy review is deferred for the private family version;
the session window is fixed; and disclosures use bundled text and audio.
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
  glyph itself, as a real amplitude meter. That last one resolves a collision the
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
