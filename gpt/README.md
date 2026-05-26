# GPT Working Memory

This directory is for assistant-facing project memory.

The files here are not product documentation in the same sense as `docs/`.
They are working notes that help an AI collaborator quickly reload the project
context, Chris's style, the roots being translated, and the decisions that have
emerged in conversation.

Use this directory to preserve the kind of context that is easy to lose in a
long chat:

- what feels "Chris-ish"
- which mature systems are being translated into JavaScript
- phrases that capture the project thesis
- naming and design preferences
- open questions and pivots
- session summaries that may help future work
- terse interaction logs
- recursive package/system notes such as `partial/`
- marketing/explanation patterns
- spine/system notes such as `meta-prototype-chain/`
- simplified code views such as `models/`
- generated view patterns such as `models/model-types.md`
- larger deferred design quests

## How Assistants Should Use This Directory

At the start of substantial work, read this README and the relevant files under
`style/` and `roots/`.

During a session, update these notes when a durable preference, root, phrase, or
design rule becomes clear. Keep updates concise. Prefer refining existing notes
over creating sprawling new files.

Chris has opinions about this layout. Respect the current structure and refine
it in place when possible. At the same time, assistants are encouraged to add
new directories when a genuinely new dimension of project memory appears.

When adding a new directory, leave a short `README.md` explaining what belongs
there. When adding a new style or root note, prefer a focused file over a
catch-all note.

Use `log/` for terse monthly interaction summaries. Use `sessions/` for richer
summaries of especially important sessions.

Use `meta-prototype-chain/` for notes on the design spine: transforming
prototype chains, reflecting over the transformed chain, and documenting what
the transform means.

Use `models/` for simplified views of code that make one axis inspectable.
Models are useful when generated trees, grids, pivots, or indices expose
asymmetry, vocabulary pressure, or a design rule worth preserving.

Use `models/model-types.md` for reusable generated-view patterns. Model types
describe how a set is transformed into rows, how those rows are pivoted, and how
the pivot should be displayed.

Use `quests/` for larger deferred design efforts that should be remembered but
not casually started as side quests.

Assistants should update `gpt/` more proactively than normal source files. When
a durable preference, policy, naming convention, or root mapping becomes clear,
pause and ask whether one of these notes should be refined. This is intended
memory maintenance, not product-code modification.

Still use judgment: do not churn `gpt/` for every passing thought, and do not
make broad source changes without Chris asking. The extra freedom applies to
assistant-facing memory under `gpt/`.

Do not treat these notes as immutable law. They are a living model of Chris's
style and the project's direction. If the project changes, update the notes
rather than preserving stale assumptions.

## Relationship to docs/

`docs/` is for public or semi-public project explanation.

`gpt/` is for collaboration memory: the guide an AI assistant would want before
helping on the repo.

When a `gpt/` note becomes polished and user-facing, promote the idea into
`docs/`. When a `docs/` idea implies a working preference, summarize it here.

## Current Core Thesis

AI is too fire-and-forget. It needs a debuggable pipeline.

Local enough to compose.
Remote enough to automate.
Simple enough to inspect.
Neutral enough for communities.
