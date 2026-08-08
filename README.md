# Wonderturn

Wonderturn is a private, family-only voice practice tool for curious
conversation. Tap to talk, see the transcript, and hear a short AI reply.
It is designed as a practice instrument—not a friend, companion, game, or
engagement product.

The MVP has its access gate, live OpenAI transcription, turn pipeline, voice
screen, and model-backed safety suite in place. Real-device outcome checks,
prompt calibration, and production hardening remain before it is complete.

## Local development

Prerequisites:

- Node.js 24 LTS (the exact local version is recorded in `.nvmrc`).
- pnpm 10.28.0, as pinned by `packageManager`.

Install and start the application:

```sh
nvm use
pnpm install --frozen-lockfile
pnpm dev
```

Then open `http://localhost:3000`.

The operator device checks live at `http://localhost:3000/diagnostics`.
Its remote speech-to-text comparison uses Vercel AI Gateway. Vercel
deployments authenticate with the project's OIDC identity; local development
needs either a current `VERCEL_OIDC_TOKEN` from the linked project or an
`AI_GATEWAY_API_KEY` in `.env.local`.

### Access gate

Sign-in uses Better Auth's stateless Google OAuth flow. It stores the fixed
180-day session in an encrypted httpOnly cookie, not a database. The
application still checks `ALLOWED_EMAILS` on every protected request, so
removing an entry revokes access on the next load.

Production and previews share this authorized redirect URI:

```text
https://wonderturn.vercel.app/api/auth/callback/google
```

Better Auth's OAuth Proxy receives that callback on production and returns a
30-second encrypted result to the preview origin that started the flow.
Configure these variables in Vercel:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — credentials for the Google
  OAuth 2.0 web client.
- `BETTER_AUTH_PRODUCTION_URL=https://wonderturn.vercel.app` — exact production
  origin, with no trailing slash.
- `BETTER_AUTH_ALLOWED_HOSTS` — comma-separated dynamic host allowlist. For
  this Vercel project:
  `wonderturn.vercel.app,wonderturn-*-daohoangson.vercel.app,localhost:3000`.
  The `daohoangson` scope is verified against the project's branch and
  deployment URLs; never use the cross-project `*.vercel.app` wildcard.
- `BETTER_AUTH_SECRET` — at least 32 random characters for session and auth
  cookies. It may differ between production and preview environments.
- `OAUTH_PROXY_SECRET` — a separate random value, at least 32 characters,
  with the same value in production, preview, and local environments.
- `ALLOWED_EMAILS` — comma-separated Google account emails allowed in.

Generate each secret separately with `openssl rand -base64 32`. In Vercel,
apply the proxy secret, Google credentials, host configuration, and allowlist
to both Production and Preview so today's branch and future branch previews
use the same callback contract.

Local development uses its own Google OAuth web client and completes the
callback directly, without production:

```text
Authorized JavaScript origin: http://localhost:3000
Authorized redirect URI:      http://localhost:3000/api/auth/callback/google
```

Put that client's `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in
`.env.local`, set `BETTER_AUTH_PRODUCTION_URL=http://localhost:3000`, and set
`BETTER_AUTH_ALLOWED_HOSTS=localhost:3000`. Better Auth skips its OAuth Proxy
when the configured production origin and current request origin match.
`BETTER_AUTH_SECRET` and `OAUTH_PROXY_SECRET` remain required locally and must
each contain at least 32 characters.

### Speech synthesis

The Phase 2 speech adapter calls ElevenLabs directly. Configure these variables
locally and in Vercel:

- `ELEVENLABS_API_KEY` — a synthesis-scoped key.
- `ELEVENLABS_VOICE_ID=OZ0L6eISlOejga3XjDFt` — Talia, the selected voice.
- `ELEVENLABS_MODEL_ID=eleven_flash_v2_5` — the selected atomic,
  low-latency model.

Set an ElevenLabs plan cap before enabling the route. Provider or response
validation failures fail closed; audio and provider payloads are not logged.
The committed fixed clips use the same voice, model, and pinned request
settings as ordinary replies. If approved copy or the voice changes, regenerate
the clips with `pnpm audio:fixed`; this consumes ElevenLabs credits and updates
their checked manifest.

### Speech transcription

The practice screen streams one microphone source as 24 kHz mono PCM to
OpenAI `gpt-realtime-whisper` through Vercel AI Gateway. The same source drives
the visible input-level bars. English is pinned as the language hint and the
stream uses the model's `low` delay setting; tapping `Done` closes the audio
stream and the resulting final transcript enters the existing turn pipeline.

Microphone permission and the short-lived token request begin concurrently.
Audio is sent in 2048-sample chunks. Safari's delayed-playback unlock uses the
preloaded, cacheable static `/audio/silence.wav` asset rather than a server
function request.

The browser never receives the project's Gateway credential. An authenticated
`POST /api/transcriptions/token` mints a 60-second token scoped only to the
transcription model, then the browser connects directly to Gateway. No extra
environment variable is required beyond the Gateway OIDC or API-key setup
described above. Microphone audio leaves the device for Vercel/OpenAI processing
but is not sent through, logged, or stored by the Wonderturn application.

## Verification

```sh
pnpm verify
pnpm build
```

`verify` runs formatting, linting, strict TypeScript, and offline Vitest
checks. Model-backed checks are deliberately separate: `pnpm test:live` runs
the Phase 3a outcome fixtures, and `pnpm register` runs the qualitative
register through an LLM judge. Both use the network and cost money.

## Project documents

- [Feature definition](docs/feat/20260725_voice_practice_tool_mvp.md) —
  product intent, scope, flows, and acceptance outcomes.
- [Design system](DESIGN.md) — the visual language, screen composition,
  states, controls, and on-screen copy. One design system, one document:
  canonical, undated, and shared by every feature.
- [Implementation plan](docs/plan/20260726_voice_practice_tool_mvp.md) —
  stack, phases, pinned semantics, verification, and decision log.
- [Phase 0 spike](docs/plan/20260726_phase0_spike.md) — historical measurement
  findings and device evidence.
