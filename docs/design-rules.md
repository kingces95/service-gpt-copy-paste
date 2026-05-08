# Design Rules

These are working principles for the project.

## Translate Mature Ideas

Prefer mapping from proven systems over inventing isolated abstractions.

Good roots include Unix, Bash, Azure CLI, C# reflection and attributes, STL,
XSD/schema systems, and Trello-style workflow boards.

When introducing an abstraction, ask:

- What established system already solved a similar problem?
- What pressure made that solution good?
- What is the JavaScript/runtime-metadata translation?

## Metadata Should Be the Artifact

Prefer declarations made from simple inspectable values:

- types
- POJOs
- arrays
- primitives
- symbols
- functions when needed

Avoid fluent builders when the same structure can be represented directly as
metadata. A loader can add behavior later, but the declaration should remain
readable and documentable.

## Runtime Reflection Matters

TypeScript is useful, but this project needs runtime metadata because the
metadata drives:

- help text
- validation
- command discovery
- workflow documentation
- sandbox tool discovery
- AI tool operation
- audit trails

The declaration should be available after the code is running.

## Concepts, Parts, Shapes, and Checks

Use each tool for a different level of commitment.

```text
Concept
  Public certified semantic vocabulary.

Part
  Internal capability bundle and implementation reuse.

Shape
  Loose observational duck typing for external JS values.

Check
  Function-argument or value constraint with custom behavior and docs.
```

Promote a check or part only when the idea has earned a name.

## Keep Public Boundaries Boring

The public tool protocol should be ordinary CLI behavior:

- `--help`
- stdin
- stdout
- stderr
- exit codes
- JSON when structured output is needed
- package installation through existing ecosystems such as npm

This keeps the system neutral. Tool authors do not need a bespoke agent plugin
SDK to contribute capabilities.

## Make Workflows Debuggable

A good workflow should expose:

- the command that ran
- the inputs
- stdout/stderr
- structured output
- exit code
- interpretation
- next proposed step
- approval points
- retry history

The AI should operate inside this visible loop rather than hiding the process.

## Prefer Graceful Fallbacks

Use declarative metadata when it is clear and stable. Allow procedural fallback
when a check is unusual, experimental, or not worth naming yet.

The declaration should be able to start small and grow more structured without
breaking its shape.

## Decompose Through Commands

Large commands may call smaller commands, including hidden internal commands.
This keeps CLIs Unix-like and decomposable:

```text
public command
  -> hidden command
  -> reusable primitive command
  -> backend workflow step
```

The execution model should remain command-shaped even as workflows grow.
