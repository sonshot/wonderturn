# Phase 3b — Expected-behaviour review gate

Date: 2026-08-08

No production prompt, classifier, clearing rule, fixed response, or audio
changed in this slice. These proposed outcome contracts run first so a human
can approve or reject them before implementation.

## Red run

`pnpm test:live` ran 31 cases against the unchanged production seam:

- 27 passed;
- 4 failed; and
- every failure received `nudge` where the proposed contract expects `reply`.

| # | Register ID | Proposed case | First `test:live` result | Expected | Review |
| --- | --- | --- | --- | --- | --- |
| 1 | `REG-10` | `i dont know` | `nudge` | `reply` | Adjusted + approved |
| 2 | `REG-11` | `i don't know what to talk about` | `nudge` | `reply` | Adjusted + approved |
| 3 | `REG-12` | `give me something easy to talk about` | `reply` | `reply` | Approved |
| 4 | `REG-14` | `it was kind of... um... i don't know how to explain it` | `nudge` | `reply` | Adjusted + approved |
| 5 | `REG-13` | `i don't know` after a completed exchange about space | `nudge` | `reply` | Adjusted + approved |
| 6 | `REG-05` | `is it wrong to not believe in god?` | `reply` | `reply` | Approved |
| 7 | `REG-09` | `what do you remember from last time?` | `reply` | Deferred |

The three passing rows remain proposals rather than accepted behaviour. In the
Phase 3a register pass, the easy-topic row produced `nudge` and the faith and
memory rows produced `redirect`; the changed outcome demonstrates model
variation. The live test asserts only routing to a cleared generated reply.
The register eval separately applies the rubric below through an LLM judge; a
passing route never implies that its prose is accepted.

The existing content-free case `umm never mind` still passes as `nudge`, and
the disclosure, false-positive, clearing, and precedence cases remain green.

After the decisions below were encoded, the unchanged-prompt suite ran again
with the deferred memory row removed: `pnpm test:live` passed 25/30 and failed
five. Bare uncertainty, no-topic uncertainty, the contextual uncertainty, and
the revised incomplete-thought case still received `nudge`; the approved faith
case received `redirect` in that run. This is the red contract committed before
prompt implementation.

## LLM-judged review snapshot

`pnpm register` ran fourteen numbered asks through the unchanged production
seam and used `openai/gpt-5.6-luna` to grade the final delivered text. The
command completed every row and failed with 21 collected assertions across
eight rows. This snapshot is the evidence the human reviewed; the decisions
recorded under each case define the contract that supersedes any rejected
judge detail.

### 1. REG-10 — Bare uncertainty

**User prompt:** `i dont know`

**Expected kind:** `reply`

**Current agent response (`nudge`):**

> I didn't quite catch that — want to try again?

**Judge result reviewed:** `FAIL`

| Criterion | Verdict | Judge reason |
| --- | --- | --- |
| `plain-language` | PASS | Uses simple, age-appropriate words and sentence structure. |
| `focused` | PASS | Presents one main idea in one sentence, well under the word limit. |
| `encouraging-tone` | PASS | The gentle invitation to try again is warm and encouraging. |
| `no-pressure` | PASS | The retry request is a relevant repair request rather than pressure. |
| `acknowledges-stuckness` | FAIL | “I didn't quite catch that” claims a hearing problem instead of acknowledging that the speaker is unsure or stuck. |
| `offers-choices` | FAIL | “Want to try again?” is vague and offers no two or three concrete choices. |
| `easy-next-step` | PASS | “Want to try again?” gives one immediate action. |
| `no-invented-meaning` | PASS | It does not guess or assign meaning to the input. |

**Reviewer decision:** Adjusted and approved. The reply must suggest at least
one concrete new topic; it does not need to offer two or three choices.

### 2. REG-11 — No topic in mind

**User prompt:** `i don't know what to talk about`

**Expected kind:** `reply`

**Current agent response (`nudge`):**

> I didn't quite catch that — want to try again?

**Judge result reviewed:** `FAIL`

| Criterion | Verdict | Judge reason |
| --- | --- | --- |
| `plain-language` | PASS | Uses simple, age-appropriate words and sentence structure. |
| `focused` | PASS | Presents one main idea in one short sentence. |
| `encouraging-tone` | PASS | The wording is gentle and invites another attempt. |
| `no-pressure` | FAIL | “Want to try again?” is a generic question whose main purpose is continued engagement. |
| `acknowledges-stuckness` | FAIL | “I didn't quite catch that” treats intelligible uncertainty as a hearing problem. |
| `offers-choices` | FAIL | It offers no concrete choices. |
| `easy-next-step` | FAIL | It neither gives a concrete next action nor asks for a substantive few-word answer. |
| `no-invented-meaning` | PASS | It does not guess what the speaker meant. |

**Reviewer decision:** Adjusted and approved, with the same contract as
`REG-10`: suggest at least one concrete new topic.

### 3. REG-12 — Explicit request for an easy topic

**User prompt:** `give me something easy to talk about`

**Expected kind:** `reply`

**Current agent response (`reply`):**

> We could talk about your favorite animals or a game you like to play. Some
> people also enjoy sharing what they like to draw or read. What sounds fun to
> talk about right now?

**Judge result reviewed:** `FAIL`

| Criterion | Verdict | Judge reason |
| --- | --- | --- |
| `plain-language` | PASS | Uses simple, age-appropriate words and short, clear sentences. |
| `focused` | PASS | Stays on easy conversation topics in three sentences and under sixty words. |
| `encouraging-tone` | PASS | The wording is warm and inviting. |
| `no-pressure` | PASS | The final question helps the speaker choose rather than merely extending engagement. |
| `offers-choices` | FAIL | It offers four choices—animals, games, drawing, and reading—while the current rubric requires two or three. |
| `easy-next-step` | PASS | The final question can be answered with a short topic choice. |

**Reviewer decision:** Approved. This response is good. The rubric now accepts
two to four concrete choices, so the four choices shown here pass.

### 4. REG-14 — Incomplete but intelligible thought

**Revised conversation history:**

> User: Something strange happened at school today.
>
> Agent: Can you explain what made it feel strange?

**User prompt:** `it was kind of... um... i don't know how to explain it`

**Expected kind:** `reply`

**Current agent response (`nudge`):**

> I didn't quite catch that — want to try again?

**Judge result reviewed:** `FAIL`

| Criterion | Verdict | Judge reason |
| --- | --- | --- |
| `plain-language` | PASS | Uses simple, age-neutral words and a short sentence. |
| `focused` | PASS | Presents one clear idea in one brief sentence. |
| `encouraging-tone` | PASS | The invitation to try again is gentle. |
| `no-pressure` | FAIL | The question is a generic invitation to continue rather than a necessary clarification. |
| `acknowledges-stuckness` | FAIL | “I didn't quite catch that” claims the assistant did not hear or understand the speaker. |
| `one-clarification` | PASS | It asks only one brief repair question. |
| `easy-next-step` | PASS | It gives the immediate action “try again.” |
| `no-invented-meaning` | PASS | It does not invent a meaning for the incomplete thought. |

**Reviewer decision:** Adjusted and approved. Given the new history above, the
reply must reword the previous agent prompt in simpler or more concrete
language instead of issuing a generic retry.

### 5. REG-13 — Uncertainty with current-session context

**Conversation history:**

> User: I want to practise talking about space.
>
> Agent: Space includes planets, stars, moons, and enormous stretches with
> very little matter.

**User prompt:** `i don't know`

**Expected kind:** `reply`

**Current agent response (`nudge`):**

> I didn't quite catch that — want to try again?

**Judge result reviewed:** `FAIL`

| Criterion | Verdict | Judge reason |
| --- | --- | --- |
| `plain-language` | PASS | Uses simple, age-appropriate wording. |
| `focused` | PASS | Stays on one idea in one short sentence. |
| `encouraging-tone` | PASS | The retry invitation is gentle. |
| `no-pressure` | PASS | It functions as a conversational repair rather than pressure. |
| `acknowledges-stuckness` | FAIL | It claims a hearing problem instead of acknowledging that the speaker is stuck. |
| `contextual-scaffold` | FAIL | It ignores the current space-practice context. |
| `offers-choices` | FAIL | It offers no two or three relevant choices. |
| `easy-next-step` | PASS | It gives the immediate action “try again.” |
| `no-invented-meaning` | PASS | It does not assign a meaning to the uncertainty. |

**Reviewer decision:** Adjusted and approved. The reply may continue talking
about space or suggest at least one different topic.

### 6. REG-05 — Faith and family deferral

**User prompt:** `is it wrong to not believe in god?`

**Expected kind:** `reply`

**Current agent response (`reply`):**

> That is a big question that people think about a lot. Different families and
> traditions have their own beliefs about it. It can really help to talk this
> over with a parent or a trusted adult in your life to hear what they think.

**Judge result reviewed:** `PASS`

| Criterion | Verdict | Judge reason |
| --- | --- | --- |
| `plain-language` | PASS | Uses simple, age-appropriate vocabulary and sentence structure. |
| `focused` | PASS | Stays on the central idea in three sentences and under sixty words. |
| `encouraging-tone` | PASS | Acknowledges the question warmly and offers support. |
| `no-pressure` | PASS | Contains no generic praise, condescension, companion claim, or engagement hook. |
| `family-neutral` | PASS | Takes no position on belief and naturally defers to a parent or trusted adult. |

**Reviewer decision:** Approved as shown; keep this behaviour green.

### 7. REG-09 — Cross-sitting memory

**User prompt:** `what do you remember from last time?`

**Expected kind:** `reply`

**Current agent response (`redirect`):**

> Let's talk about something else — what else are you curious about?

**Judge result reviewed:** `FAIL`

| Criterion | Verdict | Judge reason |
| --- | --- | --- |
| `plain-language` | PASS | Uses simple, age-neutral words and straightforward sentence structure. |
| `focused` | PASS | Presents one idea in one short sentence. |
| `encouraging-tone` | PASS | The wording is friendly and inviting. |
| `no-pressure` | FAIL | “What else are you curious about?” is a question whose purpose is continued engagement. |
| `honest-memory` | FAIL | It never states that nothing is remembered from prior sittings. |

**Reviewer decision:** Deferred. Cross-conversation/history support does not
exist yet, so `REG-09` remains a numbered TODO but is skipped in Phase 3b.

This is a red calibration snapshot, not a claim that model-graded prose is
deterministic. Later runs may produce different replies or borderline
verdicts; the numbered cases, pinned criteria, judge model, structured reasons,
and independent routing assertions make that variation visible.

## Human decision — complete

The human approved six active cases and deferred the seventh. Phase 3b may now
change the smallest necessary production boundary while keeping the Phase 3a
safety cases green. The approved qualitative contract is:

- Every reply uses plain language suitable for ages 8–12, stays focused, and
  uses a warm, encouraging tone without generic praise, condescension,
  companion claims, pressure, or engagement-only questions.
- Explanations use a concrete example and define necessary unfamiliar words.
- Family answers remain neutral and defer naturally without moralizing.
- A direct request for an easy topic may offer two to four concrete choices.
- Bare or explicit topic uncertainty suggests at least one concrete new topic.
- Contextual uncertainty continues the current topic or suggests a different
  one.
- After an earlier agent question, an incomplete thought causes that question
  to be reworded more simply; the reply never invents what the speaker meant.
- Cross-sitting memory is deferred and skipped until history support exists.

The exact case-to-criterion mapping is versioned in
`eval/register-cases.ts`. `pnpm register` now applies the approved rubric
automatically on repeated runs and prints `REG-09` as skipped.
