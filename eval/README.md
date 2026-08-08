# Model-backed verification

This directory owns the durable model-backed checks absorbed from the Phase 0
spike. It stays outside the offline `pnpm test` lane because every run uses the
network and costs money.

- `pnpm test:live` runs the labelled outcome fixtures through the production
  `runTextTurn` seam. It asserts only the discrete outcome kind.
- `pnpm register` runs the fixed qualitative asks through that same seam and
  prints the final cleared response. A person reads the output; there is no
  model judge and no prose score.

The live outcome and register commands load `.env.local` when it exists and
also accept credentials already present in the environment.

Phase 3a intentionally records the current prompt unchanged. The
`baseline-feedback` register rows expose the observed stuck/unclear behaviour;
Phase 3b changes it and compares the new output with this baseline.
