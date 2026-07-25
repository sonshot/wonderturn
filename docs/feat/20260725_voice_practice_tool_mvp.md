# Voice Practice Tool MVP

## Problem

Kids (ages 8-12) benefit from open-ended, curiosity-driven conversation
practice — asking questions, exploring topics, talking through ideas — in a
way that feels natural, not like a quiz or a typing exercise. There isn't a
simple, private way for the user's own kids to have that kind of conversation
today — one that happens by voice, responds quickly enough to feel like a
real back-and-forth, and is trustworthy enough that a parent doesn't have to
supervise every exchange.

This needs to run somewhere reachable over the internet rather than only on
the user's own machine, which means it can't rely on an unlisted link as its
only gate — a link can leak or be guessed, and every conversation costs real
money to run. Access has to be restricted to people the user actually
approves, not just people who happen to have the URL.

## Principles

1. **A conversation-practice tool, not a friend or companion.** It succeeds
   by what it builds in a kid — conversational confidence, curiosity — not
   by how long or how often it's used.
   - No streaks, no "come back" nudges, no dark patterns or reward loops, no
     hook questions asked just to extend a turn.
   - Honest about its own limits rather than performing confidence it
     doesn't have — it never implies it remembers a past conversation, has
     feelings, or is more certain about the world than it actually is.
   - No opinions on what belongs to the family — faith, values, discipline,
     family conflict — it defers to a trusted adult, even when nothing
     unsafe is being discussed.
2. **Safe enough for a kid to use unsupervised.** No adult needs to be
   present or monitoring in real time.
   - Every reply is checked for appropriateness before it's spoken.
   - A genuine disclosure (a kid saying something that suggests they're
     hurt, bullied, or unsafe) gets a distinct, warmer response that hands
     off to a trusted adult, rather than trying to handle it directly.

## Proposal

A voice tool a kid can use to practice conversation: tap a button to start
talking, tap it again to stop, and hear an age-appropriate spoken reply back
— no typing required, in English both ways for v1.

A genuine disclosure gets a distinct, adult-pointing response instead of the
ordinary safety redirect (see Principles) — neither case leaves the kid
with silence or a broken interaction.

Access is gated by sign-in, restricted to a short, approved allowlist of
family accounts (see Scope) — anyone else is turned away before a single
conversation happens.

For v1 there's no memory or per-kid profiles, no identity beyond "signed in
with an approved account" (see Scope for what's planned later). In short:
sign in, talk, get a safe, natural-sounding reply, repeat.

## Scope and fences

**In scope:**

- A single, ongoing back-and-forth voice conversation in one sitting (nothing
  is remembered once the page is closed or reloaded).
- One general-purpose, kid-safe persona for v1 — same for every session.
- A safety check on every reply before it's spoken, with a fixed fallback
  response when a reply doesn't pass.
- A distinct disclosure response, separate from the generic safety-redirect
  fallback (see Principles).
- Sign in (mechanism not yet decided — see plan), gated to a short,
  explicitly-approved allowlist of accounts (the family's own) — anyone else
  is denied access. If a third-party provider is used, major providers
  require under-13 kids to use a supervised or parent-linked account rather
  than a standalone one, so the allowlist will likely be parent accounts in
  practice, not the kids' own — confirmed once the mechanism is picked and
  before build.

**Out of scope (explicitly deferred):**

- The lowest-latency, most expressive voice architecture — replies are
  screened for safety before they're spoken, which this MVP treats as more
  important than shaving off a second of latency; revisit only if response
  speed becomes an issue in real use.
- Remembering conversations across sessions, or multiple profiles (e.g.,
  separate kids, or separate practice languages like English vs. Spanish) —
  planned for a later version once the MVP proves the core experience; v1
  has no memory and a single shared, general-purpose persona.
- A parent-facing dashboard or usage limits/controls. No cost cap or spend
  limit — the allowlist is treated as sufficient protection against
  unbounded cost, and the family sharing a single device is an accepted
  limitation for v1.
- Self-service sign-up, invites, or any way to grow the allowlist without the
  user manually approving it.
- Languages other than English, for v1 — even if addressed in another
  language, it only understands and replies in English; other practice
  languages are part of the later multi-profile plan above, not this MVP.
- Analytics or usage tracking beyond knowing something broke.

## UI/UX

Phone-first, single-screen, minimal chrome, since family testing happens
mostly on phones; laptop/tablet only needs to stay usable, not optimized for.

The talk screen is one big tappable control (tap to start, tap again to
stop — no press-and-hold), anchored low on the screen for one-handed thumb
reach, with a transcript panel above it. While it works out its reply, the
control shows a simple "thinking" cue rather than silence, so a multi-second
pause doesn't read as broken. Every state (idle, listening, thinking,
talking, the empty-input nudge, the safety redirect, the disclosure
response, an error) reuses this same layout — only the control's label and
transcript content change.

The transcript sits above the control rather than below it: new lines grow
upward toward eye level, landing closest to the button so the most recent
line stays easy to track, and it keeps scrolling text clear of the phone's
bottom-edge gesture zones (home-indicator swipe, Android's back-swipe area).
It streams both sides of the conversation in real time — the kid's words as
they're recognized, its reply as it's generated — visible as well as
audible, though the kid never has to read it. It doesn't change the app's
no-storage stance (see Security).

Mobile-specific behavior worth calling out for build/test:

- Tapping (not holding) sidesteps the long-press-vs-native-context-menu
  conflict, but rapid double-tapping can still trigger the browser's
  double-tap-to-zoom gesture — the tap target needs to guard against that.
- Microphone permission prompts, recording, and playback need to be
  verified on both a Safari-based phone browser and an Android/Chrome-based
  phone browser — the two the family will actually use.

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

1. **Sign-in gate:** Visitor opens the link → prompted to sign in → if their
   account isn't on the approved allowlist, they're denied access with a
   plain "not available to you" message and nothing further happens. If
   approved, they land on the talk screen.
2. **Happy path:** Kid taps to start talking, asks something, taps again to
   stop → the kid's words stream onto the screen as they're recognized → a
   "thinking" cue shows while it understands what was said, forms an
   age-appropriate reply, and confirms the reply is safe → the reply
   streams onto the screen as it's generated and is spoken back at the same
   time, within a few seconds of tapping stop.
3. **Empty or hesitant recording:** Kid taps to start, hesitates or says
   something like "never mind," and taps to stop with little or no real
   speech captured → it gives a light, non-punishing nudge ("didn't quite
   catch that, want to try again?") rather than treating it as an error or
   a failed safety check.
4. **Safety redirect:** A reply doesn't pass the safety check → the kid
   sees and hears a friendly, generic redirect line instead, with no
   visible difference in how the interaction feels or flows — the
   transcript shows the redirect text, never the checked content.
5. **Disclosure response:** What the kid said reads as a genuine concern
   (being hurt, bullied, unsafe) → it responds warmly and points toward a
   trusted adult, using non-generic wording, distinct from the ordinary
   safety redirect, shown in the transcript like any other reply.
6. **Something goes wrong:** Any part of the pipeline fails, including being
   interrupted mid-conversation (a call, notification, or screen lock on the
   kid's phone) → the kid sees/hears one simple, clear "something went
   wrong, try again" moment. No half-finished replies, no silent guessing at
   what was meant.

## Security, privacy, and authorization

- Nothing a kid says or hears is stored by this app in v1. The streaming
  transcript is a live, on-screen display of the current exchange only — it
  exists in the browser for that conversation and disappears on reload, the
  same as the audio — neither is logged or retained by anything the user
  builds. Only the fact that something failed (not its content) may be
  logged for debugging. This covers the app itself — the third-party
  speech, language, and safety-check providers it calls have their own
  retention policies, outside this app's control. A later version is
  expected to persist conversations to support multiple profiles (see
  Proposal); that's a deliberate future change, not an accidental one.
- This is a private, non-commercial tool used only by the user's own family
  — the kind of regulatory exposure aimed at commercial operators collecting
  children's data (e.g., COPPA) doesn't apply here, so no additional
  compliance work is planned for v1.
- Sign-in is used only to check "is this person on the approved list," not
  to collect or use any profile information about the signed-in account.
- The approved allowlist is a short, manually-maintained list the user
  controls directly (see Scope).
- This access gate exists primarily to control cost exposure and keep the
  app away from strangers; it is a hard requirement for deployment, not a
  fast-follow.
- The safety check and the disclosure response are both hard requirements
  for launch, verified against adversarial test prompts and disclosure
  phrasings before shipping — not validated by design alone.

## Ownership

Single-developer project — building, running, and monitoring this
personally for family use.
