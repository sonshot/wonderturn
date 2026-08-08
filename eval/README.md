# Model-backed verification

This directory owns the durable model-backed checks absorbed from the Phase 0
spike. It stays outside the offline `pnpm test` lane because every run uses the
network and costs money.

- `pnpm test:live` runs the labelled outcome fixtures through the production
  `runTextTurn` seam. It asserts only the discrete outcome kind.
- `pnpm register` runs the fixed qualitative asks through that same seam and
  prints the final cleared response, expected outcome kind, objective word and
  question markers, and a case-specific LLM judgment. GPT-5.6 Luna grades every
  applicable criterion with a structured pass/fail verdict and reason; the
  command fails when routing or any criterion fails. The judge is a different
  model family from the Gemini reply model.

`pnpm test` validates the judge-result boundary offline, including exact
coverage of every applicable criterion. It does not call a model.

Numbered cases may carry a documented deferral. `pnpm register` prints those
rows as `SKIPPED` and makes no system-under-test or judge call for them.

The live outcome and register commands load `.env.local` when it exists and
also accept credentials already present in the environment.

Phase 3a intentionally records the current prompt unchanged. The
`baseline-feedback` register rows expose the observed stuck/unclear behaviour;
Phase 3b changes it and compares the new output with this baseline.
