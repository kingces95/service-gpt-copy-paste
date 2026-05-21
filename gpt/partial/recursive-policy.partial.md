# Recursive Documentation Policy

This directory should be maintained as a recursive tree of understanding.

## Rule

At each layer, document the same questions:

1. What existing idea is being translated?
2. What is the local JavaScript form?
3. What metadata is declared?
4. What loader or reflector interprets it?
5. What runtime behavior falls out?
6. What should future assistants be careful about?

## Layers

### System Layer

File: `gpt/partial/README.md`

Purpose: explain the entire `partial-*` family.

### Package Layer

File: `gpt/partial/packages/<package>/README.md`

Purpose: summarize one package, its root analogy, public API, and role in the
overall system.

### File Layer

Section: `File Notes` inside each package README, or a future
`files/<source-file>.md` if more detail is needed.

Purpose: explain what the source file contributes and what concepts it maps.

### Concept Layer

Optional future directory: `gpt/partial/concepts/`

Purpose: explain cross-package ideas such as meta-prototype chains,
transparent partial types, abstract descriptor resolution, concept
certification, and condition thunking.

## Expansion Policy

Start with concise summaries. Split a section into its own file when:

- the explanation needs examples
- multiple packages depend on the same idea
- an analogy deserves its own source-system mapping
- a future assistant would benefit from reading it independently

Prefer additive refinement. Do not make this directory a transcript.

## Naming Policy

Use local package names for package directories.

Use source-system feature names for root mapping notes when the note is under
`gpt/roots/`. Inside `gpt/partial/`, use local names when explaining package
mechanics and root names when explaining analogies.
