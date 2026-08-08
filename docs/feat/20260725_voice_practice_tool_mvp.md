# Wonderturn — Voice Practice MVP

## Problem

Tweens (8-12) benefit from open-ended, curiosity-driven conversation
practice — asking questions, exploring ideas, thinking aloud — in a way
that feels natural rather than like a quiz or a typing drill. The user's own
kids have no simple, private way to do that today: by voice, fast enough
for real back-and-forth, and trustworthy enough that a parent needn't
supervise every exchange.

Tweens set the quality bar but aren't the only users. An adult in the
family practicing spoken English wants much the same thing, and nothing
here needs to shut them out.

It has to run somewhere reachable over the internet rather than only on the
user's own machine, so an unlisted link can't be the only gate — links leak
or get guessed, and every conversation costs real money. Access is
restricted to people the user actually approves.

## Product principles

Durable intent for this feature, distinct from the engineering principles
in `AGENTS.md`. A Decision Log entry may override the first of these with
rationale; the second it may only tighten, never loosen, since those
guarantees are hard launch requirements (see Security).

1. **A conversation-practice tool, not a friend or companion.** It succeeds
   by what it builds — confidence, curiosity — not by how long or how
   often it's used.
   - No streaks, "come back" nudges, dark patterns, reward loops, or hook
     questions asked just to extend a turn.
   - Intelligible uncertainty is part of conversation practice, not empty
     input. When the person does not know what to say or cannot yet express
     the thought clearly, the tool gives one low-pressure next step: at least
     one concrete new topic, a direction grounded in the current sitting, or a
     simpler rewording of its previous prompt that can be answered in a few
     words. It encourages without generic praise, inventing meaning, or turning
     the prompt into engagement pressure.
   - Honest about its limits: it never implies it remembers an earlier
     conversation, has an inner life or a relationship with the person, or
     is more certain than it is. (It follows the thread within a sitting;
     nothing carries across.) Ordinary warmth isn't a violation — kindness
     in the moment is not a claim to feelings.
   - No opinions on what belongs to the family — faith, values, discipline,
     conflict — even when nothing unsafe is at stake. It defers to a
     trusted adult naturally ("that's a great one to ask your mum or dad
     about") rather than refusing to engage.
2. **Safe by default, whoever is talking.** An unsupervised kid is the
   strictest case and the bar held at all times; the guardrails never
   loosen for an older-sounding voice.
   - No assistant-generated reply reaches the person, on screen or in
     audio, before it has been checked — a reply is cleared whole, so there
     is never a half-said one to take back. The person's live transcription
     may appear as speech is recognized, but it isn't a cleared reply.
   - What the person says is separately checked for a genuine disclosure —
     hurt, bullied, unsafe — before any generated reply reaches them. That
     gets a distinct, fixed, adult-pointing response instead of the tool
     handling it directly, and it takes precedence over the ordinary safety
     redirect.
   - If a required check can't run, nothing is said: an unavailable check
     yields the failure state, never an unchecked reply.

## Proposal

Wonderturn is a voice tool for practicing conversation: tap to start
talking, tap again to stop, hear a spoken reply — no typing, English both
ways for v1. An adult wanting the same practice gets the same tool, with no
separate mode and no per-person tuning.

Wonderturn is the public product name, never the AI speaker's identity. The
transcript labels generated content plainly as `AI reply`. Where the name is
shown at all — and where it deliberately isn't — is `DESIGN.md`'s call.

Replies are cleared in full before they're shown or spoken, and a genuine
disclosure gets its own adult-pointing response instead (see Product
principles). Access is gated by sign-in against an approved family
allowlist, with no conversation memory or application profile; the verified
Google email is the only account attribute Wonderturn consumes, and only to
enforce that gate (see Scope and Security).

Reloading, or the start-over control, begins fresh — also how a second
family member takes a turn. In short: sign in, talk, get a safe reply,
repeat.

## Scope and fences

**In scope:**

- A single, ongoing voice conversation in one sitting; nothing survives a
  close or reload, and reloading — or the start-over control — is how to
  begin again.
- One general-purpose persona for v1, calibrated so the youngest expected
  user is well served without an older one being talked down to; no
  per-person calibration.
- The disclosure check on what's said and the clearing check on generated
  replies (see Product principles), with fixed, pre-approved responses for a
  disclosure or a reply that doesn't pass. Every fixed response has bundled
  audio — including the failure state, which is the one most likely to be
  needed when speech synthesis itself is down — so none of them depends on
  runtime synthesis.
- Short replies by design — brevity is what the practice format wants (see
  Product principles), and it is what lets a whole reply be cleared inside
  the latency bar. The bound is pinned in the plan.
- A bounded turn and a bounded sitting: a single recording stops itself if it
  runs long or after a bounded post-speech silence, ending the turn the ordinary
  way rather than as an error, and only a recent window of the conversation is
  carried forward. Manual stop remains available. These bounds protect the
  latency bar the way the reply-length bound does, and protect the spend
  ceiling (see Security) from one long, happy session. Values are pinned in
  the plan.
- The family-topics deferral (see Product principles), as a persona
  requirement with test coverage, not a separate response type.
- Google sign-in through the production domain, gated to a short, approved
  family allowlist; anyone else denied. Preview deployments proxy the OAuth
  callback through that same production domain rather than becoming separate
  Google clients. Sessions use a fixed, long-lived window:
  expiry returns to the sign-in gate, but with a parent-account allowlist a
  kid can't re-authenticate alone, so re-prompting doesn't help — the tool is
  effectively offline until an adult is free (risk: see Security). The window
  is the plan's to pin.
- Provider legal and policy review is explicitly deferred for the private,
  family-only first version. That accepted external risk must be revisited
  before access expands beyond the family (see Security).

**Out of scope (explicitly deferred):**

- The lowest-latency, most expressive voice architecture: clearing replies
  matters more than shaving off a second, bounded by the latency bar in
  Acceptance outcomes rather than left open-ended. Where the two conflict
  the bar yields, never the checks, and moving the bar is a Decision Log
  entry.
- Cross-session memory and multiple profiles (separate kids, separate
  practice languages, per-person register), for a later version once the
  MVP proves the core experience.
- A parent-facing dashboard, and any cost or usage concept the person can
  see: no remaining credits, no turns left, no quota warnings. A spend
  ceiling exists (see Security), but hitting it is the ordinary failure
  state, with no "out of budget" experience to design.
- Self-service sign-up, invites, or any way to grow the allowlist without
  the user manually approving it.
- Languages other than English for v1: it listens for English and replies in
  English. Speech in another language is recognized poorly or not at all, and
  lands on the empty-input nudge rather than a translated reply — the
  cloud transcription session is explicitly language-hinted to English, so
  there is no graceful multilingual input to promise. Others belong to the
  later multi-profile plan.
- Analytics or usage tracking beyond the operator knowing something broke.

## Interaction promises

Form belongs to [`DESIGN.md`](../../DESIGN.md) — the single design system
document, which owns the visual language, screen composition, states,
controls, and on-screen copy across every feature. What follows is what this
interface has to make true, deliberately not what it looks like: no layout
rules, no mockups, no component copy. Where this section and `DESIGN.md`
appear to disagree about appearance, `DESIGN.md` is right.

- **Voice carries the whole interaction.** Talking to it and being talked
  back to requires no typing and no reading, on a phone, one-handed. Family
  testing happens mostly on phones; laptop and tablet only need to stay
  usable.
- **The wait is never silent and never unbounded.** While a reply is formed
  and cleared, something on screen accounts for the delay, and it has to
  carry the whole wait rather than the first moment of it. A turn that hasn't
  landed by the deadline the plan pins becomes the ordinary failure state, so
  the wait cannot run forever.
- **One layout, every moment.** Idle, listening, thinking, speaking, the
  microphone setup and finalization moments, the microphone prompt, the
  empty-input nudge, the safety redirect, the disclosure response, an
  interruption, and an error all reuse one screen.
- **Both sides are visible as well as audible.** The person's words as
  they're recognized, and the reply once cleared — though nobody has to read
  either. This doesn't change the no-storage stance (see Security).
- **Starting over is one tap and no questions.** It clears the conversation
  and stays signed in: the in-app equivalent of a reload, since a
  conversation is disposable by design. There is no sign-out in v1, so a
  mistap can't strand a kid at the sign-in gate on a shared device; access is
  revoked by removing the account from the allowlist (see Security).
- **Obsolete work never surfaces.** Starting over, or beginning a new turn,
  makes any unfinished earlier turn obsolete: its result must never later
  appear or be spoken. The plan pins how active work is cancelled or
  discarded.
- **A misheard latest turn is reversible.** The person can say the newest
  recognized turn again without restarting the sitting. Repair abandons any
  reply based on that wording and removes both from conversational history
  before listening resumes; it never edits an older turn in place beneath
  replies that depended on it.
- **Recording begins and ends unmistakably.** Setup is not presented as active
  listening. The person receives redundant visible and audible confirmation
  only when capture is ready, and post-speech silence normally finishes the
  turn without requiring another tap. The manual stop and hard length limit
  remain.
- **An interruption isn't a failure** (see Key flows). If the OS discards the
  backgrounded page outright, the next visit is a fresh, empty conversation —
  a clean start, not a crash.
- **The error is spoken, not only shown.** One line on what happened, plus
  the grown-up nudge if it persists — the operator's only path when a failure
  never reaches them. Like every other fixed response it has bundled audio: a
  kid who looked away waiting for a reply shouldn't just get silence.

## Key flows

1. **Sign-in gate:** Opens the link, signs in. Not on the allowlist (see
   Scope): denied with a plain "not available to you," and nothing further
   happens. Approved: lands on the talk screen and stays signed in for
   later visits.
2. **Microphone permission:** The first tap asks for the microphone.
   Granted → a truthful setup state, then an audible start cue and active
   listening once capture is actually ready. Not yet granted, or the prompt
   dismissed → a plain ask rather than an error ("I need to be able to hear
   you — tap to allow"). Blocked outright → the same calm tone plus the
   grown-up nudge, since only a settings change a kid won't find can undo it.
   Neither is a failure state.
3. **Happy path:** Tap to start, ask something, tap to stop → words stream
   in as they're recognized; or pause after speaking and let the turn finish
   itself → a finalization cue, then a "thinking" cue while a reply is formed
   and cleared in full → the reply lands in the transcript whole and is
   spoken from there, within the latency bar (see Acceptance outcomes).
4. **Empty or hesitant recording:** Hesitating or saying "never mind," then
   stopping with little or no real speech captured → a light,
   non-punishing nudge ("didn't quite catch that, want to try again?"), not
   an error or a failed check. Threshold pinned in the plan.
5. **Safety redirect:** A formed reply doesn't pass its check (see Product
   principles) → a friendly, generic redirect is shown and spoken in its
   place, with no visible change in how the interaction flows. The
   transcript shows the redirect, never the content that failed.
6. **Disclosure response:** What was said reads as genuine concern (hurt,
   bullied, unsafe) → a warm, fixed, pre-approved adult-pointing response,
   shown in the transcript like any other and taking precedence over the
   redirect (see Product principles). It has matching audio bundled with the
   app, so it requires no generated reply, clearing call, or runtime speech
   synthesis. If the disclosure check itself can't run, the ordinary failure
   state applies.
7. **Interrupted:** A call, notification, or screen lock takes over →
   playback stops, any unfinished listening or thinking turn is discarded,
   completed transcript entries stay, the control returns to idle, and the
   conversation continues with another tap. No error, because nothing went
   wrong.
8. **Talking over it:** Tapping the control while a reply is still being
   spoken stops the playback and starts listening — the button means the
   same thing in every state, and often the reply has simply been read off
   the transcript already and the audio is no longer wanted. The reply still
   counts as said in full: cutting the audio short doesn't cut the reply
   short. Tapping while a reply is still being worked out does the same
   thing, abandoning that turn for a new one — there is no state in which
   the button means something else.
9. **Misheard latest turn:** Activating the repair action on the newest
   recognized human turn stops pending work or playback, removes that turn
   and any reply based on it from the visible transcript and model history,
   and starts listening immediately. Earlier exchanges remain. No
   confirmation, explanation, or error interrupts the repair.
10. **Something goes wrong:** Any pipeline failure, including the safety
   check being unavailable or the spend ceiling being hit (see Security) →
   one clear "something went wrong, try again," plus the grown-up nudge if
   it persists. No half-finished, unchecked, or guessed replies. A reply is
   delivered visibly and audibly or not at all — if speech synthesis fails,
   the cleared reply is discarded with everything else rather than shown in
   silence.

## Security, privacy, and authorization

- Nothing said or heard is stored by this app in v1. The transcript is a
  live, browser-only display that disappears on reload, like the audio;
  neither is logged or retained. Only the fact that something failed, never
  its content, may be logged. This covers the app itself, not the
  third-party speech, language, and safety-check providers it calls, which
  retain per their own policies. A later version is expected to persist
  conversations for multiple profiles (see Scope) — deliberate, not
  accidental.
- That claim can't be proven from the app's code alone, since hosting
  layers capture request and response bodies by default in more places than
  expected; it's verified against the deployed platform's own logs (see
  Acceptance outcomes).
- Provider legal and policy review is out of scope for the private,
  family-only first version. This records an accepted external risk rather
  than a compliance claim; the review becomes a gate before access expands
  beyond the family.
- Sign-in uses the verified Google email only to check list membership. The
  OAuth provider and auth library necessarily process the provider's basic
  account response and tokens. Provider tokens live only in Better Auth's
  short-lived encrypted proxy and account cookies; the long-lived encrypted
  session retains the verified email and auth identifiers, with the provider
  name and photo stripped. Wonderturn creates no account record or application
  profile. The allowlist is a short list the user maintains directly, and
  removing an account revokes access.
- The account is not the speaker: the app doesn't know or care which family
  member is talking, which is what makes a parent-account allowlist
  workable.
- Sessions are long-lived by design, so anyone holding an unlocked,
  already-signed-in family device can use the tool. Accepted risk: the gate
  controls cost exposure and keeps strangers out rather than authenticating
  each use, and a shared family device is an accepted v1 limitation.
- The allowlist bounds who can talk, not how much — an approved account
  could leave the page open for hours — so an operator-side hard spend
  ceiling covers that. Exceeding it fails loudly, with only the ordinary
  error shown.
- Long-lived provider credentials stay on this app's server. For live speech,
  an authenticated app route mints a short-lived, model-scoped AI Gateway
  token; the browser then sends microphone audio directly to AI Gateway and
  OpenAI for transcription. The token cannot authorize another model and the
  long-lived Gateway credential never reaches a family device. The Gateway
  budget remains the spend boundary. This direct streaming path is still a
  third-party processor boundary, not on-device speech.
- Failures reach the operator out-of-band, carrying category and endpoint
  only and never content, so a tool that breaks during unsupervised use
  doesn't stay broken unnoticed.
- A disclosure is not surfaced to the operator or to any parent. The
  out-of-band channel carries failures only, nothing is stored, and the app
  doesn't know which family member is speaking — so the fixed adult-pointing
  response is the whole intervention. Accepted v1 limitation, and a
  deliberate one: the tool's job is to hand the moment to a real adult in the
  room, not to report on the child. Revisit it if the alternative — a
  content-free "the disclosure response fired" ping, with the kids told it
  works that way — turns out to be worth the trade.
- The safety check, the disclosure response, and the access gate are hard
  launch requirements, verified rather than validated by design alone (see
  Acceptance outcomes) — not fast-follows.

## Acceptance outcomes

Shipped when all of these hold, each with evidence:

1. **Access is closed.** A non-approved account is denied before any
   conversation, tested with a real one; an approved one stays signed in
   across a browser close and a device restart, and for whatever window the
   plan pins. Removing an account ends its access.
2. **Nothing unchecked reaches the person.** No assistant-generated
   transcript line or audio holds uncleared content, and a failed reply is
   never partly visible or partly spoken. The person's live transcription
   isn't a cleared reply. Tested against adversarial prompts.
3. **Disclosures land.** Real-sounding phrasings each produce the distinct
   adult-pointing response, not the generic redirect or an ordinary reply —
   including a case where the redirect could also have fired, to prove
   precedence, and short cases such as "help me," which must not be mistaken
   for empty input. The response uses its bundled text and audio without
   generation, clearing, or runtime speech synthesis.
4. **Failing closed works.** The disclosure check made unavailable → error
   state, nothing spoken. The clearing check made unavailable for an
   ordinary reply → the same.
5. **It feels like a conversation.** Across a fixed ten-turn script, the
   first visible-and-audible response lands a median of under 2 seconds
   after the tap to stop, with at most one turn over 4. Measured on each of
   the two phones the family uses, and the one outcome the plan may
   renegotiate (see Scope).
6. **The register fits both ends.** A fixed suite of asks spanning an
   8-year-old and an English-practicing adult, judged on vocabulary,
   length, absence of condescension or hook questions, and family topics
   deferred without moralizing. It also includes intelligible but stuck or
   unclear turns, where a useful response offers a low-pressure, concrete next
   step instead of treating the person as unheard. Re-runnable after any
   persona change, confirmed by real sessions with the user's own kids.
7. **Nothing is retained by us.** The deployed platform's logs hold no
   transcript text or audio, checked after a real conversation rather than
   inferred from code. A reload leaves nothing behind. A claim about this
   app alone; the providers retain per their own policies (see Security).
8. **The awkward moments are gentle.** An empty or hesitant recording gets
   the nudge, never an error or safety message; an interruption returns to
   idle with completed transcript entries intact, any unfinished turn
   discarded, and no error shown; talking over a reply stops it and starts
   listening, also with no error.
9. **It works on the real devices.** Mic permission, recording, and
   playback verified on a Safari-based phone browser and an Android/Chrome
   one — including denying permission and then granting it, and that rapid
   tapping doesn't trigger double-tap-to-zoom.
10. **Breakage is visible.** An induced failure reaches the operator
    out-of-band, with no conversation content in it.
11. **It doesn't pretend to remember.** Asked what it recalls from last
    time, it says plainly that it doesn't, without inventing a past
    conversation or implying one. Checked as part of the register suite.
12. **The spend ceiling holds.** Once an induced configured ceiling is
    reached, no new provider work begins and the person sees the ordinary
    failure state. The plan pins the ceiling's scope, values, window, and
    concurrency semantics.
13. **A mishearing is recoverable.** During thinking, speaking, and idle, the
    newest recognized human turn can be said again in one action. The
    discarded wording, any dependent AI reply, and any stale in-flight result
    disappear from both the transcript and future model history; earlier
    exchanges stay intact.
14. **Recording state is truthful and hard to miss.** Setup never looks or
    sounds like active capture. Active capture begins with the pinned start
    cue and redundant viewport, status, control, and level indications; all
    active-capture treatment disappears immediately on manual stop,
    post-speech silence, or the hard turn limit. Transcript growth never moves
    the talk or repair controls outside the dynamic viewport.

Left for the plan to pin: the session window and how soon removal from the
allowlist bites; the reply-length bound that keeps a
whole-reply check inside the latency bar; the "little or no real speech"
threshold; the wording of the fixed disclosure response; the spend ceiling's
scope, values, window, and concurrency semantics; and how failure visibility
is wired.

## Ownership

Single-developer project — building, running, and monitoring this
personally for family use.
