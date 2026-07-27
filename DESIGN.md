# Wonderturn

## Overview

Wonderturn is a warm, calm practice space. It should feel closer to a
voice notebook or a simple recording studio than to a messenger, game,
classroom, smart speaker, or AI companion.

The person is the active presence. The interface is an instrument they
operate, not a character waiting for attention. Trust comes from visible
state, predictable controls, legible text, and the absence of engagement
pressure.

### Ownership

There is one design system, so there is one design document: this file. It is
canonical and deliberately undated, and it covers every feature rather than
belonging to any of them — the visual language, screen composition, states,
controls, and the on-screen copy it pins. Features are many and dated; the
design system is one and current.

That fixes the direction of every reference:

- **Feature documents** (`docs/feat/YYYYMMDD_<slug>.md`) own product promises,
  safety guarantees, and scope — what an interface has to make true, never how
  it looks. A feature doc describes the surfaces it needs and delegates their
  form here; it does not carry mockups, layout rules, or component copy. The
  first is
  [voice practice MVP](docs/feat/20260725_voice_practice_tool_mvp.md).
- **Implementation plans** (`docs/plan/YYYYMMDD_<slug>.md`) own pinned
  correctness semantics, timing bounds, verification, and any string with a
  committed audio clip behind it. A plan may *plan* a change to this file —
  that is the normal way this file changes — but the change lands here, and a
  dated document never supersedes it.

Where this file and a neighbour genuinely conflict: form is this file's call,
promises belong to the feature doc, and a string with bundled audio belongs to
the plan and must be quoted exactly.

New work adds a dated feature doc and edits this file. It does not add a
second design document.

**Names and rules here; values in code.** This file owns what the pieces are
called, what they are for, how they relate, and what is forbidden. It does not
own hex codes and pixel counts — those live in Tailwind's `@theme` and in
component code, where a build, a typecheck, and a rendered screen can catch a
wrong one. Two value defects got through review while they lived here: a
control pinned to an exact height that clipped its own label at 200% zoom, and
a canvas whose highest channel was green while this very sentence promised warm
paper. A browser finds both in seconds; no amount of reading does.

Numbers that carry an *argument* still belong here — the contrast ratios under
Colors, the ~360px at which the control zone stops being sticky, "48px is a
floor, not a fixed value." Those are reasoning, not configuration.

Theme primitives are cited by their real custom properties —
`--color-canvas`, `--text-transcript` — and an offline test asserts that every
custom property cited here exists in Tailwind's `@theme`. Values used by only
one component live with that component rather than pretending to be reusable
tokens.

### Design principles

1. **Practice, not relationship.** No face, name, avatar, mood, backstory,
   presence indicator, or companion language belongs to the AI.
2. **State is the personality.** Ready, listening, thinking, speaking, and
   failure must be unmistakable without decorative animation.
3. **One screen, one active turn.** Earlier turns remain readable, but only
   the current turn and the large talk control compete for attention.
4. **Transcript, not chat.** Conversation is an ordered dialogue ledger,
   not a feed of messages from social actors.
5. **Age-neutral competence.** An eight-year-old can understand the screen
   without an adult feeling patronized.
6. **Calm awkward moments.** Permission, hesitation, interruption,
   disclosure, redirection, and failure preserve the same layout and visual
   volume.
7. **Honest atomicity.** An AI reply appears whole before audio begins. Do
   not stream it, type it out, or imply that a personality is composing it.
8. **No engagement pressure.** No streaks, scores, praise bursts, goals,
   hook questions, usage counters, or prompts to return.

## Aesthetic intent

Everything else in this document says what to avoid. This section says what to
aim for, and it exists because the alternative was tested: an earlier draft was
handed to four independent implementers, and all four produced screens that
satisfied every prohibition and still looked like unstyled forms. A fence is not
a target. Calm is the goal; blandness is what you get when calm is specified
only as the absence of loudness.

Reference points, in order of usefulness:

- A **hardback children's novel.** Warm paper, serif text with air around it, no
  ornament, and total confidence that the words are enough.
- A **field recorder or a good mechanical metronome.** One substantial control,
  unmistakable state, nothing that lights up asking for attention.
- A **hand-bound notebook.** Material warmth, with the craft visible in
  proportion, tone, and edge rather than in graphics.

Explicitly not: a chat app, a smart-speaker companion, a learning game, a
dashboard, a meditation app, or anything with a hero gradient.

Five commitments, each of them checkable on a screenshot:

1. **The transcript is the largest text on the screen.** Wherever a transcript
   exists, nothing outranks it — including the header title. If anything
   competes with it, the hierarchy is wrong.
2. **The canvas is warm.** Held beside pure white it must read as paper.
3. **The talk control reads as an object** — it has an edge and a rim, and it
   looks like it could be pressed.
4. **There are two planes, not one flat field:** canvas and plinth.
5. **Exactly one element is alive, and only while recording** — the level
   meter, driven by the person's own voice.

A screen that honours every prohibition here and still looks like an unstyled
form has failed this section. This is the section to fix it against.

## Colors

The atmosphere is warm mineral paper with dark green-black ink. Deep teal is
the sole primary action color. Supporting state colors are pale and
functional; they never replace a text label or icon.

- **Canvas (`--color-canvas`).** The full-page background, and genuinely warm:
  red ≥ green > blue, the temperature of uncoated paper. Do not substitute pure
  white, a cool blue-gray, or a neutral off-white — a neutral canvas is the
  single fastest way to make this system look unfinished rather than calm.
- **Plinth (`--color-plinth`).** One step deeper than the canvas, used for the
  control zone only. It gives the screen two planes so the instrument reads as
  sitting *on* something. It is a tone, not a card: no border, no radius, no
  shadow of its own.
- **Surface (`--color-surface`).** Notices and the sign-in action. Most
  transcript content sits directly on the canvas rather than inside cards.
- **Ink (`--color-ink`).** Primary text, icons, and strong boundaries.
- **Muted ink (`--color-ink-muted`).** Secondary explanations and metadata.
  It is still body-readable, not decorative fine print.
- **Primary (`--color-primary`).** The talk control and the rare highest
  priority action. Do not spread teal across headings or transcript turns.
- **Primary active (`--color-primary-active`).** The talk control's inner rim
  and pressed fill; it is not a separate voice-state color.
- **On primary (`--color-on-primary`).** Action text and glyphs placed on the
  primary fill.
- **Soft line (`--color-line-soft`).** Decorative separation only.
- **Strong line (`--color-line-strong`).** Meaningful control boundaries
  where a fill is not present.
- **Focus (`--color-focus`).** A dedicated three-pixel keyboard focus ring.
  Focus is never communicated by a subtle color shift alone.
- **Thinking (`--color-thinking-bg`, `--color-thinking-ink`) and speaking
  (`--color-speaking-bg`, `--color-speaking-ink`).** Reserved for their status
  chips. The words and glyphs still carry the state.
- **Error (`--color-error-bg`, `--color-error-ink`).** Reserved for actual
  failure. Listening is never red.

The declared foreground/background pairs target WCAG 2.2 AA and were computed
against the warm canvas, not the old neutral one: ink 14.9:1, muted ink 6.1:1
on canvas and 5.7:1 on the plinth, white on primary 6.4:1, thinking 6.9:1,
speaking 7.5:1, error 6.2:1, strong line 4.0:1. Browser-level contrast checks
remain required because rendering, opacity, and compositing can change the
result.

Do not add gradients, rainbow accents, neon “AI” colors, or dark cinematic
surfaces. A dark theme is deferred until every state can be tested as a
complete system.

## Typography

Two families, and the split carries meaning: **the serif is the conversation,
the sans is the application.**

- **Reading (`--font-reading`).** Literata, a serif designed for screen
  reading. It sets the transcript and the titles — everything that is content or
  greeting. Serif is also what children's books are set in, which serves
  age-neutral competence better than a friendly sans ever could: it reads as a
  real book rather than as software being nice to a kid.
- **UI (`--font-ui`).** The native stack. It sets buttons, status,
  notices, and labels — everything that is machinery.

Literata is self-hosted through `next/font` with `font-display: optional` and
the system-serif fallback declared above. That combination is what makes a
webfont acceptable here: `optional` means it never blocks first paint and never
reflows — a first visit may render in the fallback serif and every later one
gets Literata from cache. If it never loads at all, the design degrades to
Georgia or Iowan Old Style and still reads as intended. Load one variable
weight range, latin subset only, and nothing else; do not add a second face, an
icon font, or a display face for headings.

- **Screen title (`--text-screen-title`).** Sign-in and denial screens. Reading
  family.
- **Section title (`--text-section-title`).** Header title and short
  empty-state headings. Reading, and deliberately *smaller* than the transcript:
  the header is chrome, not content, and a one-word title does not need to
  outrank the conversation to be found.
- **Transcript (`--text-transcript`).** The main reading voice, and deliberately
  the largest text on the screen — this is the content, and the hierarchy should
  be obvious at a glance rather than inferred. Keep its generous line height and
  never shrink it to fit more history.
- **Body (`--text-body`).** Explanations, notices, and status sentences. UI
  family, and a step smaller than the transcript so it stays subordinate to it.
- **Button (`--text-button`).** Action labels. UI family, sentence case.
- **Meta (`--text-meta`).** Speaker labels and compact state labels. UI family,
  with tracking, because a small label earns its authority from letterspacing
  rather than from size. Never use all caps.

**On any screen showing a transcript, nothing is set larger than the
transcript.** That is why `section-title` sits below it and why `screen-title`
appears only on the sign-in and denied screens, which have no transcript to
outrank. If a ruler on a screenshot finds bigger text than the conversation,
the hierarchy is wrong no matter which token produced it.

Avoid thin weights, novelty fonts, monospaced UI copy, faux-handwriting,
overly rounded “kids” type, and text below 14px. Do not encode *speakers* with
typeface changes — `You` and `AI reply` are both the reading family; the only
typeface distinction in this system is conversation versus machinery.

## Layout

The application fills the dynamic viewport and respects every device safe
area. It has one centered content column with a maximum width of 42rem.

### Region skeleton

```
┌──────────────────────────────┐ ← safe-area inset top
│ header title      start over │   ≥ 64px, does not scroll
├──────────────────────────────┤
│ ▲ older turns move upward    │
│                              │
│   transcript log             │   flexible; scrolls on its own
│                              │
│   newest turn                │
│   inline / error notice      │   newest item, bottom of region
├──────────────────────────────┤ ← 1px + optional shadow, only when scrolled
│         state status         │   above the control, never beside it
│        ┌────────────┐        │
│        │    talk    │        │   104 × 104, circular
│        │  control   │        │
│        └────────────┘        │
└──────────────────────────────┘ ← calc(16px + safe-area inset bottom)
```

The skeleton names regions and their order; it is not a mockup. Its horizontal
rules mark where one region ends and the next begins — they are not painted
lines, and only the control-zone boundary ever becomes a visible one.
Deliberately absent: any string a person would read, and any per-state variant
of this diagram. Both are traps. Copy drifts the moment it exists in two files — the
feature doc's deleted mockups had a stale header title, a stale speaker label,
and a stale control label — and a set of one-box-per-state drawings would
duplicate the talk-control table while conveying less, since the whole point
of these five states is that the boxes never move.

### Phone layout

- Default horizontal gutter: `--spacing-lg`.
- At widths below 360px: reduce the gutter to `--spacing-md`.
- Header: at least 64px high, with `Practice` on the left and the full
  `Start over` label on the right.
- Transcript: consumes the flexible middle space and scrolls independently
  when necessary. New turns land nearest the control while older turns move
  upward.
- A fresh transcript shows a quiet empty state: `Ready when you are` and
  `Tap Talk and say what you'd like to practice.` Once a completed turn
  exists, idle retains the transcript instead of restoring the empty state.
- A notice replaces the empty state rather than joining it. Once a microphone
  or error notice is present, `Tap Talk…` is gone — leaving it there tells the
  person to do the thing that just didn't work.
- Control zone: filled with `--color-plinth`, `--spacing-md` top padding and
  `calc(16px + env(safe-area-inset-bottom))` bottom padding. The tone change is
  what marks the region — it takes no border, radius, or shadow of its own.
- The control zone may be sticky, but it must never overlay transcript text.
- Landscape remains usable; do not lock orientation.

### Whitespace

Whitespace communicates calm and separates turns. Prefer empty canvas over
wrapping each item in a card.

The named scale runs from `--spacing-xxs`, `--spacing-xs`, `--spacing-sm`,
`--spacing-md`, and `--spacing-lg` through `--spacing-xl`, `--spacing-xxl`,
`--spacing-xxxl`, and `--spacing-section`. Use the smallest steps for
label-to-content relationships, the middle steps for component and gutter
rhythm, and the largest steps only between screen sections.

The empty state occupies the transcript region without illustration, and its
composition is what keeps it from reading as an unfinished screen: set the two
lines optically centred in the region — slightly above true centre — with
`--spacing-xs` between them, left-aligned to the same gutter as transcript
text rather than centred horizontally. It should look like the first page of a
notebook, not like a placeholder waiting for content.

## Elevation & Depth

Depth comes from tone, not shadow. `canvas` → `plinth` → `surface` is the
entire z-language, and it is enough.

- Canvas and transcript: no shadow.
- Notices: tonal surface plus a one-pixel line where needed.
- Control zone: at most one restrained shadow,
  `0 -4px 18px rgb(23 33 31 / 6%)`, when scrolling content must be separated
  from it.
- Focus ring: three pixels with a two-pixel canvas-colored offset. The offset
  is what does the work — the ring never abuts the teal fill, so its only
  adjacency is the canvas, which it clears at 5.8:1.

Do not use glass, blur, floating chat cards, stacked panels, glossy buttons,
or multiple competing shadows.

## Shapes

Most controls use `--radius-control` and notices use `--radius-notice`. The
talk control and compact status chips use `--radius-full`. There is no
structural-panel radius, because there are no structural panels.

Roundness is hierarchical, not decorative. Do not make every surface a pill
or turn the transcript into bubbles. The talk control is circular because it
is the single physical instrument on the screen, not because it is a
character or orb.

## Components

### App shell

A full-height, safe-area-aware column. It owns the canvas, maximum content
width, and the stable regions for header, transcript, and talk control. The
document title and the installed/home-screen name are `Wonderturn`, which is
where the product name does its wayfinding work.

### Practice header

The visible header title is the plain word `Practice`. `Wonderturn` is the
product's name, not this screen's label: on a single-screen tool a brand line
does no wayfinding — the title bar and home-screen icon already carry it — and
the header's job is to stay quiet. It is never a speaker name either (see Copy
and Content).

The header carries no secondary line, subtitle, or AI-disclosure text. The
transcript labels every generated turn `AI reply`, which is a continuous
disclosure a header line cannot improve on, and the sign-in gate's category
line is the one place that text belongs.

`Start over` is text plus an optional reset glyph, never an unlabeled icon.
Its target is at least 48 by 48 CSS pixels. It clears immediately without a
confirmation dialog.

### Transcript log

Use an ordered semantic log with open vertical rhythm. Do not use chat
bubbles, portraits, timestamps, delivery marks, or typing indicators.

Each turn contains:

- A compact label in `--text-meta` and `--color-ink-muted`: `You` or
  `AI reply`.
- Transcript text underneath in `--text-transcript` and `--color-ink`,
  `--spacing-xxs` below its label.
- At least `--spacing-lg` between speakers.

Whitespace is the only separator. Do not draw a rule between turns, between
speakers, or under the header. The soft divider has exactly one use in this
system: parting the control zone from scrolling content, and only while content
is actually scrolled.

Streaming transcription updates the current `You` turn in place. Do not
announce every interim word to assistive technology. A cleared AI reply is
inserted once, in full.

Redirects, disclosures, nudges, and ordinary replies share identical visual
styling. The interface does not expose or dramatize safety machinery.

### State status

Place a short icon-and-text status immediately above the talk control:

- `Ready`
- `Microphone needed`
- `Microphone blocked`
- `Listening`
- `Thinking`
- `Speaking`
- `Something went wrong`

The status describes what the system is doing. It is separate from the talk
control label, which describes the next action. Use a polite live region for
status changes; errors are announced once.

Only `Thinking` and `Speaking` are filled, using their declared tonal status
chips. Every other status is an unfilled inline row: `Ready` and `Listening` in
muted ink, the two microphone rows in ink, `Something went wrong` in error ink.
There is deliberately **no error status chip**, and its absence from the tokens
is the rule, not an omission — the error notice below already carries a tonal
error fill, and a second one directly above it turns one calm failure into the
red spectacle this system forbids.

Status glyphs are always paired with visible text: open circle for Ready,
microphone for both permission rows, ellipsis for Thinking, speaker for
Speaking, exclamation for Error. Listening is the exception — its bars are a
live speech-activity cue rather than an icon (see Listening cue).

The gap between the status row and the talk control is `--spacing-md`.

A fresh screen opens on `Ready` with the `Talk` label. One activation both
requests the microphone and starts listening, so an untouched screen must
never open on `Microphone needed` — that would contradict the empty state's
own `Tap Talk` instruction. `Microphone needed` is the state *after* a prompt
was dismissed without a decision; `Microphone blocked` is a denial the page
cannot re-prompt. Where a browser reports no permission state at all, `Ready`
is always the correct opening status.

### Talk control

Use a native button, 104 by 104 CSS pixels, with a simple microphone,
stop/listening, or speaker glyph and a short visible action label.

| Current state | Status | Glyph | Visible action label |
| --- | --- | --- | --- |
| Idle | Ready | microphone | Talk |
| Microphone prompt dismissed | Microphone needed | microphone | Allow |
| Microphone blocked | Microphone blocked | microphone | Try again |
| Listening | Listening | stop square | Done |
| Thinking | Thinking | microphone | Talk |
| Speaking | Speaking | microphone | Talk |
| Error | Something went wrong | microphone | Try again |

What each activation *does* belongs to the feature document's key flows and
the plan's P1. This table exists for one purpose: to show that the status and
the action can never be read as the same claim.

The glyph always describes the action, never the state, which is why it is a
microphone in six rows out of seven: every one of those activations ends in
listening. Only `Listening` differs, where a stop square matches `Done`. Do
not put the speaker glyph on this control while the reply is playing — the
status row already carries a speaker there, and repeating it on a button whose
label says `Talk` is exactly the status/action collision this table exists to
prevent. Action glyphs are single-color line art, `--spacing-xxs` above the
label.

The control is `--radius-full` at a **minimum** of 104 by 104 CSS pixels, not
a fixed 104. Under large text it grows; the label never clips and never
overflows the circle. `Try again` at 200% is the case that proves it.

Give it the quality of a real object, because it is the only one on the screen.
The disc is a flat `--color-primary` fill with a hairline inner rim, which
reads as a machined edge rather than as decoration. Its action glyph is larger
than a status glyph, with the label `--spacing-xxs` beneath it. While
Listening, add one static concentric ring in `--color-primary` outside the
disc. A ring is a form; it does not breathe, pulse, or glow, and it disappears
the instant recording stops. That distinction is the whole line between an
instrument and an orb: an instrument shows its state by holding a shape, a
companion shows it by moving.

The rim is the entire effect. Do not add directional shading, an inner
highlight, a soft inner shadow, or any other simulation of light falling on the
disc — that is a gradient wearing a different name, and it is the first thing a
capable implementer reaches for when asked to make a flat circle feel physical.
The object quality comes from an honest edge and generous size, not from faked
material.

Keep the visible label inside the 104px circle to two short words at most.
The permission button's accessible name is `Allow microphone`; its visible
label is `Allow`. One activation requests permission and, when granted,
immediately begins listening. Do not make the person tap twice. A blocked or
permanently denied permission uses the `Microphone blocked` row plus the
pinned notice under Inline notice.

The state name is never conveyed by color alone. The control activates on
release, not pointer-down. Do not use press-and-hold, swipe, hidden
cancellation, or a call/hang-up metaphor.

The talk control's pressed treatment changes the fill and nothing else: it
applies while a pointer or key is held down, alongside the press-feedback
transform under Motion, and it reverts on release. It is not the Listening
state's fill. No voice state changes this control's color — the status row, the
glyph, and the label carry state, and a state-colored button would put a fourth
signal on the one element that must stay recognisable as a single instrument.

Set `touch-action: manipulation` on the control so a fast second tap cannot
trigger double-tap zoom. Never reach for `user-scalable=no` to get that: the
200% zoom requirement outranks a gesture nuisance, and disabling scaling
breaks this document's own accessibility floor.

### Listening cue

The Listening status glyph *is* the speech-activity cue — the "activity bars"
named under State status are live, not an icon of bars. Its muted-ink bars move
with the raw microphone amplitude measured from the same stream sent for
transcription. They are an honest level cue, not a speech-confidence meter or
an animation on a timer.

Make this good rather than tolerable. It is the one genuinely alive moment the
design permits, and it earns that permission by being honest: it reflects the
person's own voice back to them instead of performing a personality. It is also
the fastest possible answer to the only question that matters while recording —
*is it hearing me?*

It never appears inside the talk control, which carries the stop glyph and
`Done` at that moment. It stops on the same frame audio capture stops, rests
at its minimum height, and never moves while the microphone is inactive. Under
`prefers-reduced-motion: reduce`, hold the bars at rest and let the `Listening`
text carry the state alone.

### Thinking cue

Use the text `Thinking` with one short three-dot sequence, then let the dots
come to rest. The wait is bounded but not always short — it can run to the
plan's request timeout — and a cue frozen at one word for that long reads as a
hung app to the person least equipped to diagnose it. Carry the rest of the
wait with one discrete, countable change: at roughly four seconds the text
becomes `Still thinking`. That is the entire progression. There is no third
step, and nothing loops.

Do not use a breathing orb, character animation, typing indicator, indefinite
pulse, progress bar, or elapsed-time counter.

### Inline notice

Permission guidance and calm contextual explanations use the same layout
width as the transcript. One short paragraph is preferred. Place the notice
as the newest item at the bottom of the transcript region, immediately above
the stable control zone.

This file owns the microphone copy, because it is screen-only: unlike the four
fixed responses, it has no bundled audio and is never spoken.

- `Microphone needed`: `I need to hear you to practice. Tap Allow, then choose
  Allow again when your phone asks.`
- `Microphone blocked`: `This page can't use the microphone yet. A grown-up can
  switch it back on in your browser's settings for this site.`

Tell the person what has to happen next, without blame and without naming a
permission API. Exact settings paths differ by platform — do not invent
step-by-step directions this document has not verified on the target phones.

### Error notice

Keep the layout stable and show the error copy pinned by the active plan,
including its repeated-error variant. Do not expose provider, budget,
safety-check, or network detail. Do not add a red screen, warning triangle
spectacle, or dead-end retry page.

The error is spoken as well as shown, from its bundled clip — a kid who looked
away waiting for a reply must not get silence. The `Something went wrong`
status and the `Try again` label both hold while that clip plays: failure does
not borrow the speaking presentation, and the audio changes nothing visually.

Preserve every completed transcript turn. Do not insert a fabricated or
empty `AI reply` for the failed attempt. Show the error notice as the newest
item in the transcript region; `Start over` remains the only action that
clears history.

### Sign-in gate

Use the same canvas, type, and spacing as the talk screen. Center one short
explanation in a narrow column:

- Product/category line: `AI voice practice`.
- Heading: `Ready to practice?`
- Body: `Sign in with your family's approved Google account to continue.`
- Google-branded action labelled `Continue with Google`.

The application owns the action that starts Better Auth's redirect flow, while
its icon, colors, spacing, and treatment follow Google's branding guidance.
Self-contained design prototypes may use a static representative version of
the same action.

While the redirect starts, its label becomes `Opening Google…` and the action
cannot be pressed again. If that initiation fails, show `Something went wrong.
Try again.` beneath it; never expose an OAuth or configuration detail.

No hero illustration, mascot, testimonials, feature grid, or marketing
navigation belongs here.

### Denied state

Screen-only copy, never spoken, and pinned here for the same reason as the
microphone notices — no clip, no plan entry, and until it is written down
nobody owns the first screen a stranger sees:

- Heading: `Not available to this account`
- Body: `You're signed in, but this account can't use Wonderturn.`

That is the whole screen. Do not reveal the allowlist or hint at its size, name
who administers it, or offer signup, invitation, appeal, or support flows.

## Do's and Don'ts

### Do

- Make voice state explicit with text, icon, and restrained visual change.
- Keep the person’s words and the complete AI reply visible.
- Keep the main action within easy thumb reach and clear of system gestures.
- Use exact, action-oriented labels.
- Preserve the same layout through waiting, interruption, and failure.
- Let the canvas and typography do most of the visual work.
- Use specific acknowledgment in replies only when warranted by content.

### Don't

- Add mascots, faces, eyes, mouths, avatars, human names, or “online”
  presence.
- Use friend, buddy, companion, partner, tutor, teacher, coach, or assistant
  as the system’s role.
- Use chat bubbles, typing indicators, incoming-call UI, lip sync, or
  emotional expressions.
- Add confetti, stars, XP, streaks, badges, goals, progress rings, praise
  bursts, reward sounds, or usage counters.
- Add sparkles, magic language, neon AI gradients, sci-fi grids, or a
  persistent glowing orb.
- Use hearts, hugs, mood colors, “I missed you,” “I’m proud of you,” or “I
  love talking with you.”
- Add shields, locks, “safe,” or “private” badges in place of precise
  explanation.
- Stream AI text, type it out, or show content skeletons for a reply.
- Use color alone for listening, thinking, speaking, or failure.
- Show spending limits, remaining turns, timers, or provider details.

## Voice State Semantics

There are five visual states: idle, listening, thinking, speaking, and error.
`Microphone needed` and `Microphone blocked` are explicit idle variants, not
extra lifecycle states. A nudge, redirect, or disclosure is content
delivered through the ordinary speaking presentation, not a special visual
state.

An interruption returns calmly to idle. It does not produce a warning,
completion badge, or celebratory cue. Starting over clears the transcript
immediately and preserves the signed-in shell.

A recording that reaches the plan's length limit stops itself through the
ordinary `Done` path: listening ends, thinking begins, and no notice, warning,
or explanation appears. It is not a state and it is not an error.

Status and action must not contradict each other. For example, while the
system is speaking, `Speaking` describes the state and `Talk` describes what
the control will do.

## Motion

Motion is functional and brief:

- Press feedback: 80–100ms, scale to 0.98.
- State crossfade: 160ms.
- Complete transcript-turn reveal: 200–240ms opacity transition.
- Standard easing: `cubic-bezier(.2,.8,.2,1)`.
- Thinking dots: one 900ms sequence, then at rest.
- Thinking text advances once, at ~4s: `Thinking` → `Still thinking`.

The speech-activity cue is not on this list. It follows live microphone
amplitude and stops when capture does.

With `prefers-reduced-motion: reduce`, remove transforms and animation.
Change status text instantly. Never auto-scroll in a way that steals the
person’s reading position; follow the newest turn only when they were already
within 24px of the bottom. State duration is driven by real lifecycle events;
motion timings are transitions, not timers for mocked thinking or speaking.

## Accessibility

Target WCAG 2.2 AA.

- Regular controls are at least 48 by 48 CSS pixels; the talk control at least
  104 by 104. Every size and height in this document is a **minimum**, never a
  fixed value. A control pinned to an exact height clips its own label at 200%
  text zoom, which contradicts the zoom requirement three bullets down — so the
  tokens say `minHeight` and `minSize`, and an implementation that writes
  `height` has introduced a defect.
- Every control works with Tab, Enter, and Space and has a persistent
  three-pixel focus ring.
- Support 200% text zoom and reflow at 320 CSS pixels without clipping or
  horizontal page scrolling.
- Tolerate user-overridden line height, paragraph spacing, letter spacing,
  and word spacing.
- Never rely on color, motion, sound, position, or an icon alone.
- The full transcript is visible text as well as audio.
- Put status text in a polite, atomic live region. Use an ordered semantic
  log for transcript turns, but exclude interim transcription text from its
  live announcements. Insert each final `AI reply` once and atomically.
- Avoid double-speaking the final reply through TTS and a screen reader.
  Test the chosen transcript announcement behavior with VoiceOver/Safari
  and TalkBack/Chrome before pinning whether the production log is polite
  during playback.
- Final AI replies enter both the visual tree and accessibility tree
  atomically.
- The speech-activity cue is hidden from assistive technology; the `Listening`
  text carries that state on its own, and a bar-height readout announces
  nothing.
- Essential icons have accessible names; decorative graphics are hidden
  from assistive technology.
- Support portrait and landscape.
- Test zoom, bold text, reduced motion, high contrast, keyboard, denied
  microphone, background interruptions, and rapid taps on the real target
  phones.

## Responsive Behavior

This is phone-first responsive design, not a desktop layout compressed onto
a phone.

- **320–767px:** one column; 16–24px gutters; talk control remains 104px;
  header actions keep full labels.
- **768–1023px:** same one-column interaction, centered with more outer
  whitespace; do not introduce sidebars.
- **1024px and above:** cap the interaction column at 42rem. The surrounding
  canvas expands; the application does not become a dashboard.
- **Short landscape viewports:** reduce vertical whitespace before reducing
  type or target sizes. Keep at least 120px for the transcript region; below
  that threshold, let the page scroll rather than shrinking or covering
  controls and text. The arithmetic is worth stating, because it decides a real
  case rather than an edge one: a 64px header, a control zone of roughly 176px
  (16 + status 32 + 16 + control 104 + 16), and the 120px transcript floor need
  about 360px of height. Small phones in landscape are shorter than that, so
  there the control zone stops being sticky and the whole page scrolls. Nothing
  shrinks, and nothing is covered.

## Copy and Content

Use plain English, contractions, and short sentences. Prefer the next
concrete action over technical explanation.

- Say `Talk`, not `Begin voice interaction`.
- Say `I need to hear you to practice`, not `Microphone permission was not
  granted`.
- Say `AI reply`, not a human name or relational role.
- Do not add generic praise such as `Great question!` to every response.
- Do not add a hook question merely to prolong use.

The four spoken fixed responses — disclosure, redirect, nudge, and error — are
pinned in the plan with a committed audio clip behind each. Quote them exactly.
Tightening one here would leave the visible text saying less than the audio
says, which is the one place this system's transcript-equals-audio promise
would visibly break.

The product name is not a speaker name. Wherever `Wonderturn` appears — the
document title, the home-screen name, the sign-in screen — the transcript
still uses `AI reply`.

## Agent Implementation Checklist

Before considering a screen consistent with Wonderturn, verify:

- The hierarchy is transcript first, talk control second, everything else
  quiet — and the transcript is literally the largest text present.
- The canvas reads as warm paper beside white, and the control zone sits on the
  plinth tone.
- The talk control has its inner rim, and its Listening ring is a static shape.
- The speech-activity cue is live only while listening, and rests otherwise.
- The reading family sets the transcript and titles; the UI family sets
  everything else.
- The canvas, ink, and primary action use the declared tokens.
- All five visual states preserve one layout.
- State and next action are both visible and cannot be confused.
- No AI persona, relationship cue, chat convention, or engagement mechanic
  has been introduced.
- The transcript is readable at the declared size and survives 200% zoom.
- The talk control and start-over action meet their target sizes.
- Safe-area insets and short landscape viewports do not obscure controls or
  transcript.
- Reduced motion produces a complete, understandable experience.
- AI reply text appears whole, never streamed.
