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
