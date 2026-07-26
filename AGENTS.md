# AGENTS.md — Way of Work

Instructions for AI agents and contributors working in this repository. This file
covers _how we work_ and the _durable principles_ behind our choices. Setup,
current structure, and configuration live in `README.md`, the feature documents in
`docs/feat/`, and the active plan in `docs/plan/` — do not duplicate them here.

## Engineering principles

Defaults for all new work. A Decision Log entry in the active plan may override an
engineering principle for a specific case with rationale — but the burden is on the
exception.

These govern how the code is built. A feature doc may define its own _product
principles_ for what a feature is and does; those belong to the doc that defines
them, which may also limit what a Decision Log is allowed to override there. When
this file and a feature doc both use the word "principle", they are talking about
different things.

1. **Greenfield.** No users yet, no legacy to protect. Don't add backward-compat
   shims, migrations, deprecation paths, or "reusable for later" scaffolding.
   Change contracts freely, delete rather than deprecate, and record the choice in
   the Decision Log.
2. **Prefer buy/reuse over build.** Reach for platform-native and off-the-shelf
   primitives (`fetch`, `AbortSignal`, `Promise.all`, Zod, better-auth)
   before writing bespoke infrastructure. Build the smallest
   focused thing the current app needs — not a general-purpose client, framework,
   or helper library.
3. **Focus on the happy path.** Pin to the real, observed contract of whatever you
   integrate with. Handle the cases that actually occur; ignore shapes you consume
   nothing from. No heuristic recovery, no defensive parsing of inputs you have
   never seen.
4. **Fail fast on any error.** On configuration, upstream, validation, or
   contract-drift failures, throw and render one sanitized failure state. No silent
   fallbacks, no partial-success degradation, no swallowed errors. A loud failure
   now beats a quiet wrong answer later. Log only failure category, endpoint, and
   status — never payloads.
5. **Parse at the boundary, then trust the types.** Everything crossing into the
   app — HTTP payloads, model output, environment configuration, third-party
   responses — is parsed by a Zod schema at the edge, and every layer inside works
   from the types that parse produced. Derive types from schemas rather than
   declaring the same shape twice. TypeScript runs strict; `any` and unchecked casts
   are defects, not shortcuts. This is not in tension with the happy path: a schema
   describes only what we actually consume, and anything that doesn't match it is a
   fail-fast error rather than a case to recover from.

## How work flows

Non-trivial work goes: **feature document → implementation plan →
implement/verify/review loop → commit coherent slices.**

- **Feature document** (`docs/feat/YYYYMMDD_<slug>.md`) — write it first for any new
  feature, architecture change, or POC. Capture the problem, the proposal, scope and
  fences, key flows, security/privacy/authorization implications, ownership, and
  acceptance outcomes. Keep it about durable intent, not a task list. Small contained
  fixes may reuse an existing doc; if a change alters promised behavior or scope,
  update the doc in the same change.
- **Implementation plan** (`docs/plan/YYYYMMDD_<slug>.md`) — write it after the
  direction is clear and link back to the feature doc. Include status, scope and
  non-goals, prerequisites and external gates with owners, phased tasks, pinned
  semantics where correctness is otherwise ambiguous, definition of done with
  verification, and an append-only Decision Log. Distinguish code-complete work from
  external deployment gates; don't call a phase deployable while credentials,
  approvals, or infra are outstanding.
- **Implement / verify / review loop** — work in small slices. For each: implement,
  run the smallest check that proves it, review the diff against intent / plan /
  Decision Log, check for security or data-boundary regressions and hidden scope,
  fix, repeat. Before handoff, run the full relevant checks and confirm each
  definition-of-done item with evidence. Review feedback is another turn of the loop.

## Decision Logs

The Decision Log preserves _why the implementation changed_ — not what happened.
Append a dated entry when a material choice changes: scope or fences; audience,
authorization, or exposed data; architecture, data source, schema, or dependency;
deployment target or external gate; a pinned correctness semantic; or a reversal of
a prior decision.

- Prefer appending to rewriting. Give entries stable IDs (`D1`, `D2`, …); say
  `Supersedes D<N>` when reversing. Rewriting an entry is fine while it is still
  uncommitted or nothing has been built on it — git keeps the history either way.
  Once an entry has shipped or later work leans on it, supersede instead: the
  point is that a reader of today's document sees the reversal without going
  digging for it.
- Record the decision alongside the change, and update the affected scope, tasks,
  definition of done, config, and code in the same change so the plan stays coherent.
- If a decision changes durable intent, update the feature doc too; if it only
  changes implementation, update the plan.

## Source of truth

Keep this file about _how we work_, not how the code currently happens to be built.

- `README.md` owns setup and operator configuration.
- Feature docs own durable intent, product/architecture boundaries, and any product
  principles specific to a feature.
- The active plan and its Decision Log own current scope, gates, and semantics.
- Code, tests, package scripts, and CI own executable behavior and verification
  commands.

Don't copy file trees, dependency versions, env-var inventories, or command lists
here — they drift. When changing a cross-cutting contract, update code, examples,
deployment config, CI, tests, and active docs together.
