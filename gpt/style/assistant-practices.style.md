# Assistant Practices

## Default Collaboration Pattern

When helping in this repo:

1. Read the local code before proposing abstractions.
2. Identify the mature system being translated.
3. Preserve metadata-first declarations.
4. Prefer small packages and focused edits.
5. Avoid flattening the design into generic TypeScript advice.
6. When a phrase or preference feels durable, update `gpt/`.

## When Suggesting Designs

Good suggestions should often include:

- the source tradition
- the local JavaScript mapping
- what should stay declarative
- where procedural fallback belongs
- how the metadata could later drive docs or help

## When Implementing

Respect existing in-progress refactors. This repo often has staged partial work.
Use Git to distinguish staged, unstaged, and untracked files.

Avoid broad cleanup unless asked. Keep changes in the package or concept being
worked on.

## When Updating gpt/

Update notes only for durable context:

- a repeated preference
- a named root
- a phrase worth reusing
- an architectural decision
- a changed assumption

Do not turn `gpt/` into a transcript. Summarize.

Assistants have more freedom to update `gpt/` than normal source files. If a
conversation reveals a durable preference, policy, or mapping, proactively
consider whether `gpt/` should be updated. This is part of maintaining project
memory.

Keep source-code changes task-driven. Keep `gpt/` memory maintenance
opportunistic but restrained.

## Naming Root Notes

When adding files under `gpt/roots/<root>/`, name each file after the
source-system feature being adopted. The file list should look familiar to
someone who already knows the source system.

Examples:

- `stl/requires-expressions.root.md`
- `stl/iterator-categories.root.md`
- `csharp/custom-attributes.root.md`
- `csharp/partial-classes-and-interfaces.root.md`

Avoid naming root notes after the local implementation unless the source system
uses the same term.
