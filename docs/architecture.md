# Architecture

This repository is moving toward a layered system for AI-operated, CLI-centered
workflows.

## Workflow Shape

The high-level loop is:

```text
intent
  -> discover tools
  -> propose commands
  -> execute in sandbox
  -> inspect output
  -> refine
  -> capture history
  -> publish repeatable workflow
```

The same command transcript should be useful as a debugging record, a workflow
prototype, and a basis for production automation.

## CLI Layer

The `cli-*` packages implement command declarations, metadata loading, help
projection, runtime activation, service composition, shell-like parsing, and
output formatting.

The CLI layer follows this path:

```text
Cli / CliCommand classes
  -> CliMetadata
  -> CliInfo
  -> CliYargs
  -> CliRuntime
```

Class declarations provide command trees, parameters, defaults, services, and
groups. Metadata loaders turn those declarations into a graph. Info objects
project that graph into command-scope behavior. Yargs renders command-line
parsing and help. Runtime objects activate commands, inject services, execute,
handle abort, and dispose resources.

## Cursor Layer

The cursor packages provide a JavaScript translation of STL-style generic
programming:

```text
@kingjs/cursor
  concepts and primitive cursor/range types

@kingjs/cursor-algorithm
  free algorithms over cursor capabilities

@kingjs/cursor-container
  concrete containers and capability parts

@kingjs/cursor-view
  lazy non-owning ranges/views

@kingjs/cursor-adapter
  ergonomic factories and adapters
```

The cursor layer exists because Bash-like Unix interop needs exact control over
byte streams, decoded text, parser position, and residual input.

## Partial Layer

The `partial-*` packages provide descriptor-level composition and runtime
metadata:

```text
PartialType
  Attachments
  PartialClass
  Concept
  Shape
```

This layer supplies the equivalent of partial classes, interfaces, concepts,
duck casting, abstract members, runtime preconditions, and reflection.

## Function Contract Layer

The newer function contract experiment extends the same metadata-first style to
standalone functions:

```js
fn[Preconditions] = [
  CursorConcept,
  CursorConcept,
  [
    DefaultConstructible,
    PushBackContainer,
  ],
]
```

The declaration is intentionally simple data: arrays, nulls, functions, and
types. The loader can interpret ordinary types as `instanceof` checks and
special `Check` types as custom validation with better errors and docs.

## Workflow Front End

The long-term front end could be Trello-like:

```text
card
  inputs
  attachments
  proposed commands
  execution history
  outputs
  approval state
```

The card is the human-readable state machine. The CLI/sandbox is the execution
surface. The AI agent is the operator that can discover, run, explain, and
compose tools.
