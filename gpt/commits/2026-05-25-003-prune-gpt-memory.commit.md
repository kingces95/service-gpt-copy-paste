# Prune GPT Memory To Durable Models

This checkin trims assistant-facing memory toward artifacts that still guide
future work.

The durable pieces are models: compact views that expose package shape, naming
pressure, support matrices, and design invariants. They are valuable because
they make the codebase easier to inspect from more than one axis.

The disposable pieces are transitional prose, stale work-in-progress notes, old
session/log summaries, and completed quests. Once a decision is captured by a
model, a commit note, or the current code shape, the surrounding narrative
should be removed rather than preserved by default.

The policy is to keep generated/model-like views and concise conventions, then
aggressively delete narrative debris once it stops helping future work.
