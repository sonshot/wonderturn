# Wonderturn

Wonderturn is a private, family-only voice practice tool for curious
conversation. Tap to talk, see the transcript, and hear a short AI reply.
It is designed as a practice instrument—not a friend, companion, game, or
engagement product.

The MVP is currently in foundation and device-spike work. The durable Next.js
application scaffold exists; feature work begins after the remaining device
checks pass.

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

Google needs only this authorized redirect URI:

```text
https://wonderturn.vercel.app/api/auth/callback/google
```

Better Auth's OAuth Proxy receives that callback on production and returns a
30-second encrypted result to the preview or local origin that started the
flow. Configure these variables in `.env.local` and in Vercel:

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
use the same callback contract. Localhost also participates in the proxy flow,
so `wonderturn.vercel.app` must already be deployed and configured before
local Google sign-in can complete.

### Speech synthesis

The Phase 2 speech adapter calls ElevenLabs directly. Configure these variables
locally and in Vercel:

- `ELEVENLABS_API_KEY` — a synthesis-scoped key.
- `ELEVENLABS_VOICE_ID=OZ0L6eISlOejga3XjDFt` — Talia, the selected voice.
- `ELEVENLABS_MODEL_ID` — either `eleven_flash_v2_5` for an atomic,
  low-latency response or `eleven_v3` when progressive playback is enabled
  after the iOS Safari device check.

Set an ElevenLabs plan cap before enabling the route. Provider or response
validation failures fail closed; audio and provider payloads are not logged.

## Verification

```sh
pnpm verify
pnpm build
```

`verify` runs formatting, linting, strict TypeScript, and offline Vitest
checks. Model-backed checks are deliberately separate and will be added in
Phase 3.

## Project documents

- [Feature definition](docs/feat/20260725_voice_practice_tool_mvp.md) —
  product intent, scope, flows, and acceptance outcomes.
- [Design system](DESIGN.md) — the visual language, screen composition,
  states, controls, and on-screen copy. One design system, one document:
  canonical, undated, and shared by every feature.
- [Implementation plan](docs/plan/20260726_voice_practice_tool_mvp.md) —
  stack, phases, pinned semantics, verification, and decision log.
- [Phase 0 spike](docs/plan/20260726_phase0_spike.md) — current measurement
  findings and open device checks.
