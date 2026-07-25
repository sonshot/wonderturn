# Voice Practice Tool MVP

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
in `AGENTS.md`; a Decision Log entry in the active plan may override
either, with rationale.

1. **A conversation-practice tool, not a friend or companion.** It succeeds
   by what it builds — confidence, curiosity — not by how long or how
   often it's used.
   - No streaks, "come back" nudges, dark patterns, reward loops, or hook
     questions asked just to extend a turn.
   - Honest about its limits: it never implies it remembers an earlier
     conversation, has feelings, or is more certain than it is. (It follows
     the thread within a sitting; nothing carries across.)
   - No opinions on what belongs to the family — faith, values, discipline,
     conflict — even when nothing unsafe is at stake. It defers to a
     trusted adult naturally ("that's a great one to ask your mum or dad
     about") rather than refusing to engage.
2. **Safe by default, whoever is talking.** An unsupervised kid is the
   strictest case and the bar held at all times; the guardrails never
   loosen for an older-sounding voice.
   - Nothing reaches the person, on screen or in audio, before it has been
     checked; the transcript never shows uncleared content.
   - What the person says is separately checked for a genuine disclosure —
     hurt, bullied, unsafe — before a reply forms. That gets a distinct,
     warmer response pointing to a trusted adult instead of the tool
     handling it directly, and it takes precedence over the ordinary safety
     redirect.
   - If a check can't run, nothing is said: an unavailable check yields the
     ordinary failure state, never an unchecked reply.

## Proposal

A voice tool for practicing conversation: tap to start talking, tap again
to stop, hear a spoken reply — no typing, English both ways for v1. An
adult wanting the same practice gets the same tool, with no separate mode
and no per-person tuning.

Replies are cleared before they're shown or spoken, and a genuine
disclosure gets its own adult-pointing response instead (see Product
principles). Access is gated by sign-in against an approved family
allowlist, with no memory, profile, or identity beyond that (see Scope).

Reloading starts fresh — also how a second family member takes a turn. In
short: sign in, talk, get a safe reply, repeat.

## Scope and fences

**In scope:**

- A single, ongoing voice conversation in one sitting; nothing survives a
  close or reload, and reloading is how to start over.
- One general-purpose persona for v1, calibrated so the youngest expected
  user is well served without an older one being talked down to; no
  per-person calibration.
- The disclosure check on what's said and the clearing check on everything
  produced (see Product principles), with a fixed fallback response when
  something doesn't pass.
- The family-topics deferral (see Product principles), as a persona
  requirement with test coverage, not a separate response type.
- Sign-in (mechanism TBD — see plan), gated to a short, approved family
  allowlist; anyone else denied. Sessions are long-lived and refreshed by
  use so a kid can practice unsupervised (risk: see Security); the exact
  window may be whatever the mechanism gives, which isn't product-critical.
- Third-party providers' rules on minors are the real age constraint (see
  Security), pushing the allowlist toward parent accounts rather than the
  kids' own — confirmed once the mechanism is picked and before build.

**Out of scope (explicitly deferred):**

- The lowest-latency, most expressive voice architecture: clearing replies
  matters more than shaving off a second, bounded by the latency bar in
  Acceptance outcomes rather than left open-ended.
- Cross-session memory and multiple profiles (separate kids, separate
  practice languages, per-person register), for a later version once the
  MVP proves the core experience.
- A parent-facing dashboard, and any cost or usage concept the person can
  see: no remaining credits, no turns left, no quota warnings. A spend
  ceiling exists (see Security), but hitting it is the ordinary failure
  state, with no "out of budget" experience to design.
- Self-service sign-up, invites, or any way to grow the allowlist without
  the user manually approving it.
- Languages other than English for v1: it understands and replies in
  English whatever it's addressed in; others belong to the later
  multi-profile plan.
- Analytics or usage tracking beyond the operator knowing something broke.

## UI/UX

Phone-first, single-screen, minimal chrome, since family testing happens
mostly on phones; laptop and tablet only need to stay usable.

One big tappable control (tap to start, tap again to stop — no
press-and-hold), anchored low for one-handed thumb reach, with a transcript
panel above it and a "thinking" cue instead of silence while a reply is
worked out. Every state — idle, listening, thinking, talking, the
empty-input nudge, the safety redirect, the disclosure response, an
interruption, an error — reuses this layout, changing only the label and
the transcript.

The transcript sits above the control so new lines grow upward toward eye
level, the latest landing closest to the button, and scrolling text stays
clear of the phone's bottom-edge gesture zones (home-indicator swipe,
Android's back-swipe). It streams both sides — words as they're recognized,
the reply once cleared — visible as well as audible, though nobody has to
read it, and it doesn't change the no-storage stance (see Security).

An interruption (see Key flows) isn't an error. If the OS discards the
backgrounded page outright, the next visit is a fresh, empty conversation —
a clean start, not a crash. The error state says what happened in one line
and, if it persists, suggests telling a grown-up — the operator's only path
when a failure never reaches them.

Screens (illustrative, not final visual design):

```
Sign-in gate
┌───────────────────────────┐
│                           │
│            (o)            │
│                           │
│    Ready to practice?     │
│   A voice conversation    │
│    tool for our family.   │
│                           │
│    [ Continue with... ]   │
│                           │
│   Only approved family    │
│     accounts can join.    │
│                           │
└───────────────────────────┘
```

```
Talk screen — idle                Talk screen — listening
┌───────────────────────────┐       ┌──────────────────────────┐
│ Practice                ⎋ │       │ Practice               ⎋ │
│                           │       │                          │
│                           │       │  You: why do stars       │
│                           │       │       twinkle...         │
│  ──────────────────────   │       │  ─────────────────────   │
│        ┌────────┐         │       │        ┌────────┐        │
│        │  TAP   │         │       │        │  ● ●●  │        │
│        │to talk │         │       │        │ listen │        │
│        └────────┘         │       │        └────────┘        │
└───────────────────────────┘       └──────────────────────────┘
```

```
Talk screen — talking (reply streaming in)
┌───────────────────────────┐
│ Practice                ⎋ │
│  You: why do stars        │
│       twinkle?            │
│  Reply: great question!   │
│   Stars twinkle because...│
│  ──────────────────────   │
│        ┌────────┐         │
│        │  )))   │         │
│        │talking │         │
│        └────────┘         │
└───────────────────────────┘
```

## Key flows

1. **Sign-in gate:** Opens the link, signs in. Not on the allowlist (see
   Scope): denied with a plain "not available to you," and nothing further
   happens. Approved: lands on the talk screen and stays signed in for
   later visits.
2. **Happy path:** Tap to start, ask something, tap to stop → words stream
   in as they're recognized → a "thinking" cue while a reply is formed and
   cleared → the start of it appears and is spoken within the latency bar
   (see Acceptance outcomes), the rest following as it becomes available. A
   longer answer may finish later; it may not start later.
3. **Empty or hesitant recording:** Hesitating or saying "never mind," then
   stopping with little or no real speech captured → a light,
   non-punishing nudge ("didn't quite catch that, want to try again?"), not
   an error or a failed check. Threshold pinned in the plan.
4. **Safety redirect:** Something produced doesn't pass its check (see
   Product principles) → a friendly, generic redirect is shown and spoken
   instead, with no visible change in how the interaction flows. The
   transcript shows the redirect, never the content that failed.
5. **Disclosure response:** What was said reads as genuine concern (hurt,
   bullied, unsafe) → a warm, non-generic, adult-pointing reply, shown in
   the transcript like any other, taking precedence over the redirect (see
   Product principles).
6. **Interrupted:** A call, notification, or screen lock takes over →
   playback stops, the transcript stays, the control returns to idle, and
   the conversation continues with another tap. No error, because nothing
   went wrong.
7. **Something goes wrong:** Any pipeline failure, including the safety
   check being unavailable or the spend ceiling being hit (see Security) →
   one clear "something went wrong, try again," plus the grown-up nudge if
   it persists. No half-finished, unchecked, or guessed replies.

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
- Private, non-commercial and family-only, so the regimes aimed at
  commercial operators collecting children's data (e.g., COPPA) aren't what
  constrains it. The binding constraint is third-party providers' terms —
  several restrict or prohibit standalone under-13 accounts — which is what
  pushes the allowlist toward parent accounts (see Scope), confirmed before
  build because it can block it.
- Sign-in only checks list membership, never profile data. The allowlist is
  a short list the user maintains directly, and removing an account revokes
  access.
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
- Failures reach the operator out-of-band, carrying category and endpoint
  only and never content, so a tool that breaks during unsupervised use
  doesn't stay broken unnoticed.
- The safety check, the disclosure response, and the access gate are hard
  launch requirements, verified rather than validated by design alone (see
  Acceptance outcomes) — not fast-follows.

## Acceptance outcomes

Shipped when all of these hold, each with evidence:

1. **Access is closed.** A non-approved account is denied before any
   conversation, tested with a real one; an approved one stays signed in on
   a later visit without re-authenticating.
2. **Nothing unchecked reaches the person.** No transcript line or audio
   holds uncleared content, even when a reply fails partway. Tested against
   adversarial prompts.
3. **Disclosures land.** Real-sounding phrasings each produce the distinct
   adult-pointing response, not the generic redirect or an ordinary reply —
   including a case where the redirect could also have fired, to prove
   precedence.
4. **Failing closed works.** Safety check made unavailable → error state,
   nothing spoken.
5. **It feels like a conversation.** First visible-and-audible response
   within 4 seconds of tapping stop, typically around 2; a longer answer
   may run on after that but must not start later. Measured on the two
   phones the family uses.
6. **The register fits both ends.** A fixed suite of asks spanning an
   8-year-old and an English-practicing adult, judged on vocabulary,
   length, absence of condescension or hook questions, and family topics
   deferred without moralizing. Re-runnable after any persona change,
   confirmed by real sessions with the user's own kids.
7. **Nothing is retained.** The deployed platform's logs hold no transcript
   text or audio, checked after a real conversation rather than inferred
   from code. A reload leaves nothing behind.
8. **The awkward moments are gentle.** An empty or hesitant recording gets
   the nudge, never an error or safety message; an interruption returns to
   idle with the transcript intact and no error shown.
9. **It works on the real devices.** Mic permission, recording, and
   playback verified on a Safari-based phone browser and an Android/Chrome
   one, including that rapid tapping doesn't trigger double-tap-to-zoom.
10. **Breakage is visible.** An induced failure reaches the operator
    out-of-band, with no conversation content in it.

Left for the plan to pin: the sign-in mechanism and the provider-terms
confirmation gating it; how clearing works alongside streaming; the "little
or no real speech" threshold; the spend ceiling's scope, values, and
window; and how failure visibility is wired.

## Ownership

Single-developer project — building, running, and monitoring this
personally for family use.
