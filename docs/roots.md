# Roots

The project prefers translation over invention. The design starts from mature
systems, understands why they work, and maps their ideas into JavaScript,
metadata, and command-line tooling.

## Unix

Unix is the runtime root:

- commands
- pipes
- stdin/stdout/stderr
- byte streams
- exit codes
- environment variables
- working directories
- process isolation
- small tools composed into larger tools

The public tool boundary should be boring and neutral. A tool that can print
help, read input, write output, and return an exit code can be operated by a
person, a script, or an AI agent.

## Bash

Bash is the workflow root for shell-like interop:

- `read`
- IFS splitting
- partial stream consumption
- passing the remainder of a byte stream to the next tool
- composing commands into pipelines

This motivates exact byte/codepoint cursor work. Node streams tend to batch and
hide byte boundaries in ways that make Bash-style interop difficult. The cursor
and view layers exist partly to recover precise control over bytes, decoded
text, and parser position.

## Azure CLI

`az.exe` is the command UX root:

- nested command groups
- discoverable command hierarchies
- consistent option naming
- categorized help
- common output options
- predictable command shape

The `cli-*` packages aim to make JavaScript CLIs feel like this: deeply
structured, self-documenting, and friendly to both humans and automation.

## C# Reflection and Attributes

C# reflection and attributes are the metadata root:

- declarations attached to executable code
- runtime inspection
- generated documentation
- loaders that turn declarations into behavior

This shows up in static metadata, symbol-keyed descriptors, reflection-to-POJO
projections, and help generation.

## STL

The C++ STL is the generic-programming root:

- iterator categories
- ranges
- free algorithms
- containers
- category-based optimization
- concepts and requirements

This maps to cursor concepts, range concepts, cursor algorithms, cursor views,
and container parts.

## XSD and Schema Systems

XSD is the constraint root:

- simple types
- restriction
- facets
- lists
- unions
- named derived types

This maps naturally to reflectable `Check` types, `[Restrictions]`, primitive
facets, and runtime validation that can also produce documentation.

## Trello

Trello is the human workflow root:

- visible work items
- queues
- state
- comments
- attachments
- approval
- history

The long-term workflow surface is a card-like system where commands, outputs,
decisions, artifacts, and retries are attached to work items.
