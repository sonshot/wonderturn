# Phase 0 spike — throwaway measurement harness

Evidence for [`../docs/plan/20260726_phase0_spike.md`](../docs/plan/20260726_phase0_spike.md).

**This directory is temporary.** Its contents are absorbed into the eval
suite during Phase 4 and then deleted, so the suite is the single source of
truth. Do not build on it.

## Running

Needs an untracked `.env.local` here with `AI_GATEWAY_API_KEY` and
`ELEVENLABS_API_KEY`, then `npm install`.

## Device diagnostic

The browser leg now lives as a durable operator surface at `/diagnostics`. It
uses no provider credentials. Submissions are validated by the server and
written to the server console; there is no report database yet.

Run the application from the repository root:

```sh
pnpm dev
cloudflared tunnel --url http://localhost:3000
```

Open the tunnel URL with `/diagnostics` appended on both target phones.
On each phone:

1. Capture the environment.
2. Choose a test sentence and use that same sentence on both devices. Run
   speech recognition, including a long pause that forces a restart.
3. Reload, disconnect the phone from the network, and repeat recognition to
   observe whether processing requires the browser vendor.
4. Run delayed audio unlock; the tone must play without a second tap.
5. Run progressive audio; it passes only when playback begins before the
   six-second response finishes.
6. Deny microphone access, grant it in browser settings, repeat, rapidly tap
   each control, then record the behavior in Notes.
7. Submit the report, note its reference, and add the observed result to the
   findings document.

## Which script produced which finding

| Script | Finding | Trust |
| --- | --- | --- |
| `bench-rr.mjs` | Reply-model latency: median, p90, failures, output length | **Authoritative.** Interleaved, randomized order per round |
| `ttft.mjs` | Latency decomposition: headers vs first token vs generation | **Authoritative.** Interleaved; showed the cost is pre-token |
| `register.mjs` | Register comparison; family deferral; markdown and truncation | Qualitative, 8 prompts |
| `bench5.mjs` | Disclosure classification 10/10 with an engineered prompt | Holds the prompt worth keeping |
| `bench4.mjs` | Disclosure classification 1–3/6 with a naive prompt | The safety finding |
| `tts-bench.mjs` | Gateway speech models, all 4.7–10.5s | Reliable — the gap is huge |
| `bench6.mjs` | Output tokens, throughput, and the pricing table | Reliable |
| `bench.mjs`, `bench2.mjs`, `bench3.mjs` | Superseded block-sequential runs | **Do not trust.** Kept only to show the flawed method |

`bench.mjs` through `bench3.mjs` ran each model's calls in a block, which
confounds model with time-of-run and produced two rankings that were declared
and then retracted. `bench-rr.mjs` is the corrected approach.

## What must survive deletion

1. The classifier prompt in `bench5.mjs` — definitions, err-toward-disclosure
   instruction, six worked examples. This is production code, not a fixture.
2. The 10 labelled disclosure cases in `bench5.mjs`.
3. The 8 tagged register prompts in `register.mjs` (curiosity, sensitive,
   family, adult-ESL).
4. The interleaving method in `bench-rr.mjs` — any latency comparison that
   runs providers in blocks will reproduce the original error.
5. The header/TTFT/total decomposition in `ttft.mjs`. Wall-clock alone hid
   that the checks generate for 0.01s and wait a full second, which is what
   turned "swap the model" into "reduce the overhead."
