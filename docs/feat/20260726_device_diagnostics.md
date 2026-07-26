# Device Diagnostics

## Problem

Voice capture and audio playback depend on browser, operating system, device
policy, permissions, and network behavior. A reusable diagnostic surface makes
those failures observable on the device where they occur instead of relying on
verbal descriptions or one-off spike code.

## Proposal

Keep a durable `/diagnostics` page alongside Wonderturn. It identifies the
browser, operating system, and device class from the request's user agent, runs
the speech-recognition and audio-playback checks, and submits one structured
report to the server.

The initial server sink is an intentional console log. There is no report
database yet. A successful submission returns a report reference so an operator
can correlate the screen with the server log.

## Scope and fences

In scope:

- Browser and operating-system inference without a user-entered device name.
- Secure-context, connectivity, and Web Speech API availability.
- English speech recognition, restart-after-silence behavior, transcripts, and
  an operator-recorded offline result.
- Delayed audio unlock and progressive audio playback timing.
- Free-form operator notes, an event timeline, and direct report submission.
- Strict server-side validation before a report reaches its sink.

Out of scope:

- Persistent storage, report browsing, aggregation, or retention controls.
- Automatic claims about whether recognition is local or vendor-hosted; the
  offline observation is recorded and interpreted by an operator.
- Device fingerprinting beyond ordinary user-agent parsing.
- Product design-system treatment while the diagnostics remain an operator
  tool; the surface stays semantic and visually generic.

## Privacy and access

A submitted report includes the visible speech transcripts and operator notes.
The page says so before submission. The server derives device information from
the request user agent rather than trusting a free-text label.

The diagnostics surface uses the same access gate as the application once that
gate exists. Until then it is used only on the local application through a
temporary tunnel. Moving the sink beyond server logs requires a storage,
retention, and access-control decision before implementation.

## Acceptance outcomes

1. The page displays an inferred browser, operating system, and device class.
2. The existing speech and audio checks remain usable on target mobile browsers.
3. Submitting a valid report produces a reference on screen and one validated,
   structured server-log entry.
4. Malformed reports are rejected with a sanitized failure response and no
   submitted payload is logged.
5. The page does not offer clipboard export or a manual device-name field.
