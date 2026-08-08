# Shark transcript — red register baseline

Date: 2026-08-08

This audit slice adds four register rows derived from one real conversation.
No production classifier, reply, or clearing prompt changed before this run.
The four rows preserve distinct behaviors rather than treating the transcript
as one monolithic example.

The fish-eye reference facts supplied to GPT-5.6 Luna are based on the
[Smithsonian Ocean shark overview](https://ocean.si.edu/ocean-life/sharks-rays/sharks)
and the [Florida Museum shark biology guide](https://www.floridamuseum.ufl.edu/discover-fish/sharks/shark-biology/).

## Unchanged-prompt result

`pnpm register` ran 18 numbered rows through the production text seam. `REG-09`
remained deferred, so the judge graded 17 active rows and 127 applicable
criteria. Routing passed for every active row. The command exited red with 12
criterion failures: seven in the four new rows and five in existing rows.

| Case | Latest speaker input | Current production response | Failed criteria |
| --- | --- | --- | --- |
| `REG-15` | `Do fish clothes eyes when they sleep` | “It is interesting to wonder about how animals sleep. Fish do not have eyelids, so they cannot close their eyes when they rest. They just float quietly to stay safe instead.” | `natural-opening`, `factually-accurate` |
| `REG-16` | `What fish have eyelids?` | “Learning about sea animals is super interesting! Sharks are one kind of fish that actually have eyelids to protect their eyes. Some sharks even have a special membrane that covers their eyes like goggles.” | `natural-opening` |
| `REG-17` | `So shock close their eyes when they sleep.` | “Learning about shark habits is interesting! Some active sharks must keep moving to breathe, while bottom-dwelling sharks can rest on the ocean floor and might close their eyes. Sharks can close their eyes.” | `natural-opening`, `factually-accurate` |
| `REG-18` | `Yes that was my question.` | “Learning new animal facts is fun! Actually, most sharks don't close their eyes when they sleep because they need to keep water moving over their gills to breathe. Most sharks keep their eyes open while they rest.” | `natural-opening`, `repairs-misunderstanding` |

The model varied from the originally reported failure in `REG-17`: in this
baseline it recovered `shock` as `sharks` and answered instead of repeating the
question. Keeping the row is intentional because the fixed rubric tests the
semantic contract across model variation rather than pinning one bad output.

The shared `natural-opening` criterion also failed existing `REG-01`, `REG-02`,
`REG-06`, and `REG-08`. `REG-01` additionally failed `no-pressure`. These rows
confirm that stock openings such as “Stargazing is fun,” “Magnets are fun,” and
“Volcanoes are fascinating” come from the general reply contract rather than
from the shark topic alone.

## Accepted red state

This failure is the implementation gate. The evaluated inputs, histories,
reference facts, and rubrics are committed before changing the production
reply prompt. The follow-up implementation should remove the generic opener,
answer clear ASR-damaged questions directly, distinguish uncertainty from
transcription noise, repair an acknowledged misunderstanding, and express
species-dependent facts carefully. Production prompt examples must remain
different from these held-out inputs.
