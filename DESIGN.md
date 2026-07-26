---
version: alpha
name: Wonderturn
description: A calm, age-neutral, phone-first visual system for voice practice.
colors:
  primary: "#0B6B5E"
  primary-active: "#07564C"
  on-primary: "#FFFFFF"
  canvas: "#F7F8F5"
  surface: "#FFFFFF"
  ink: "#17211F"
  ink-muted: "#4E5F5B"
  line-soft: "#DCE4E1"
  line-strong: "#72837E"
  focus: "#1457D9"
  thinking-bg: "#FFF2C7"
  thinking-ink: "#6B4E00"
  speaking-bg: "#EEF2FF"
  speaking-ink: "#344E91"
  error-bg: "#FDEEEE"
  error-ink: "#973B3B"
typography:
  screen-title:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 28px
    fontWeight: 700
    lineHeight: 34px
    letterSpacing: -0.3px
  section-title:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 22px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.1px
  transcript:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0
  body:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 17px
    fontWeight: 400
    lineHeight: 26px
    letterSpacing: 0
  button:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 16px
    fontWeight: 650
    lineHeight: 20px
    letterSpacing: 0
  meta:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0.1px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 40px
  xxxl: 48px
  section: 64px
rounded:
  control: 8px
  notice: 12px
  full: 9999px
components:
  secondary-copy:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
  divider-soft:
    backgroundColor: "{colors.line-soft}"
    size: 1px
  control-outline:
    backgroundColor: "{colors.line-strong}"
    size: 1px
  focus-ring:
    backgroundColor: "{colors.focus}"
    size: 3px
  talk-control:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    size: 104px
  talk-control-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    size: 104px
  start-over:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    border: 1px solid {colors.line-strong}
    padding: 14px 16px
    height: 48px
  status-thinking:
    backgroundColor: "{colors.thinking-bg}"
    textColor: "{colors.thinking-ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.full}"
    padding: 6px 12px
  status-speaking:
    backgroundColor: "{colors.speaking-bg}"
    textColor: "{colors.speaking-ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.full}"
    padding: 6px 12px
  inline-notice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.notice}"
    border: 1px solid {colors.line-soft}
    padding: 16px
  error-notice:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.notice}"
    padding: 16px
  sign-in-action:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    border: 1px solid {colors.line-strong}
    padding: 14px 20px
    height: 48px
---

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

## Colors

The atmosphere is warm mineral paper with dark green-black ink. Deep teal is
the sole primary action color. Supporting state colors are pale and
functional; they never replace a text label or icon.

- **Canvas (`{colors.canvas}`).** The full-page background. Do not substitute
  pure white or a cool blue-gray.
- **Surface (`{colors.surface}`).** Notices and the sign-in action. Most
  transcript content sits directly on the canvas rather than inside cards.
- **Ink (`{colors.ink}`).** Primary text, icons, and strong boundaries.
- **Muted ink (`{colors.ink-muted}`).** Secondary explanations and metadata.
  It is still body-readable, not decorative fine print.
- **Primary (`{colors.primary}`).** The talk control and the rare highest
  priority action. Do not spread teal across headings or transcript turns.
- **Soft line (`{colors.line-soft}`).** Decorative separation only.
- **Strong line (`{colors.line-strong}`).** Meaningful control boundaries
  where a fill is not present.
- **Focus (`{colors.focus}`).** A dedicated three-pixel keyboard focus ring.
  Focus is never communicated by a subtle color shift alone.
- **Thinking and speaking colors.** Reserved for their status chips. The
  words and glyphs still carry the state.
- **Error colors.** Reserved for actual failure. Listening is never red.

The declared foreground/background pairs target WCAG 2.2 AA. Browser-level
contrast checks remain required because rendering, opacity, and compositing
can change the result.

Do not add gradients, rainbow accents, neon “AI” colors, or dark cinematic
surfaces. A dark theme is deferred until every state can be tested as a
complete system.

## Typography

Use the native UI stack. It is fast, familiar on family phones, and avoids a
font download becoming part of the critical path.

- **Screen title.** Used sparingly on sign-in or denial screens.
- **Section title.** Header title and short empty-state headings.
- **Transcript.** The main reading voice. Keep its generous line height and
  never shrink it to fit more history.
- **Body.** Explanations, notices, and status sentences.
- **Button.** Action labels. Use sentence case.
- **Meta.** Speaker labels and compact state labels. Never use all caps.

Avoid thin weights, novelty fonts, monospaced UI copy, faux-handwriting,
overly rounded “kids” type, and text below 14px. Do not encode speakers with
typeface changes.

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

The skeleton names regions and their order; it is not a mockup. Deliberately
absent: any string a person would read, and any per-state variant of this
diagram. Both are traps. Copy drifts the moment it exists in two files — the
feature doc's deleted mockups had a stale header title, a stale speaker label,
and a stale control label — and a set of one-box-per-state drawings would
duplicate the talk-control table while conveying less, since the whole point
of these five states is that the boxes never move.

### Phone layout

- Default horizontal gutter: `{spacing.lg}` (24px).
- At widths below 360px: reduce the gutter to `{spacing.md}` (16px).
- Header: at least 64px high, with `Practice` on the left and the full
  `Start over` label on the right.
- Transcript: consumes the flexible middle space and scrolls independently
  when necessary. New turns land nearest the control while older turns move
  upward.
- A fresh transcript shows a quiet empty state: `Ready when you are` and
  `Tap Talk and say what you'd like to practice.` Once a completed turn
  exists, idle retains the transcript instead of restoring the empty state.
- Control zone: 16px top padding and
  `calc(16px + env(safe-area-inset-bottom))` bottom padding.
- The control zone may be sticky, but it must never overlay transcript text.
- Landscape remains usable; do not lock orientation.

### Whitespace

Whitespace communicates calm and separates turns. Prefer empty canvas and
one-pixel dividers over wrapping each item in a card. The empty state may
occupy the transcript region without adding illustration.

## Elevation & Depth

The system is almost flat.

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

Most controls use `{rounded.control}` and notices use `{rounded.notice}`. The
talk control and compact status chips are fully round. There is no
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
and Content). A small secondary line may say `AI voice practice` where an AI
disclosure is needed.

`Start over` is text plus an optional reset glyph, never an unlabeled icon.
Its target is at least 48 by 48 CSS pixels. It clears immediately without a
confirmation dialog.

### Transcript log

Use an ordered semantic log with open vertical rhythm and restrained
dividers. Do not use chat bubbles, portraits, timestamps, delivery marks, or
typing indicators.

Each turn contains:

- A compact label: `You` or `AI reply`.
- Transcript text underneath in `{typography.transcript}`.
- At least `{spacing.lg}` between speakers.

Interim speech recognition updates the current `You` turn in place. Do not
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

Ready and Listening are unfilled inline status rows using muted ink.
Thinking and Speaking use their declared tonal status chips. Error uses the
error colors. Use simple one-color line glyphs: open circle or check for
Ready, microphone for permission, level bars for Listening, ellipsis for
Thinking, speaker for Speaking, and exclamation for Error. A glyph is always
paired with its visible text.

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

| Current state | Status | Visible action label |
| --- | --- | --- |
| Idle | Ready | Talk |
| Microphone prompt dismissed | Microphone needed | Allow |
| Microphone blocked | Microphone blocked | Try again |
| Listening | Listening | Done |
| Thinking | Thinking | Talk |
| Speaking | Speaking | Talk |
| Error | Something went wrong | Try again |

What each activation *does* belongs to the feature document's key flows and
the plan's P1. This table exists for one purpose: to show that the status and
the action can never be read as the same claim.

Keep the visible label inside the 104px circle to two short words at most.
The permission button's accessible name is `Allow microphone`; its visible
label is `Allow`. One activation requests permission and, when granted,
immediately begins listening. Do not make the person tap twice. A blocked or
permanently denied permission uses the `Microphone blocked` row plus the
pinned notice under Inline notice.

The state name is never conveyed by color alone. The control activates on
release, not pointer-down. Do not use press-and-hold, swipe, hidden
cancellation, or a call/hang-up metaphor.

Set `touch-action: manipulation` on the control so a fast second tap cannot
trigger double-tap zoom. Never reach for `user-scalable=no` to get that: the
200% zoom requirement outranks a gesture nuisance, and disabling scaling
breaks this document's own accessibility floor.

### Listening cue

A small waveform may react to microphone input inside the talk control, but
it is supplementary. It must stop immediately when recording stops and must
never glow or move while the microphone is inactive.

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
- Provider-rendered Google sign-in action.

Production uses the provider-rendered action and its required branding.
Self-contained design prototypes may use a static representative button
labelled `Continue with Google`; that stand-in is not production UI.

No hero illustration, mascot, testimonials, feature grid, or marketing
navigation belongs here.

### Denied state

Show a plain heading and one sentence: the tool is not available to this
account. Do not reveal the allowlist or offer signup, invitation, or support
flows.

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

With `prefers-reduced-motion: reduce`, remove transforms and animation.
Change status text instantly. Never auto-scroll in a way that steals the
person’s reading position; follow the newest turn only when they were already
within 24px of the bottom. State duration is driven by real lifecycle events;
motion timings are transitions, not timers for mocked thinking or speaking.

## Accessibility

Target WCAG 2.2 AA.

- Regular controls are at least 48 by 48 CSS pixels; the talk control is
  104 by 104.
- Every control works with Tab, Enter, and Space and has a persistent
  three-pixel focus ring.
- Support 200% text zoom and reflow at 320 CSS pixels without clipping or
  horizontal page scrolling.
- Tolerate user-overridden line height, paragraph spacing, letter spacing,
  and word spacing.
- Never rely on color, motion, sound, position, or an icon alone.
- The full transcript is visible text as well as audio.
- Put status text in a polite, atomic live region. Use an ordered semantic
  log for transcript turns, but exclude interim recognition text from its
  live announcements. Insert each final `AI reply` once and atomically.
- Avoid double-speaking the final reply through TTS and a screen reader.
  Test the chosen transcript announcement behavior with VoiceOver/Safari
  and TalkBack/Chrome before pinning whether the production log is polite
  during playback.
- Final AI replies enter both the visual tree and accessibility tree
  atomically.
- Essential icons have accessible names; decorative waveforms are hidden
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
  controls and text.

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
  quiet.
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
