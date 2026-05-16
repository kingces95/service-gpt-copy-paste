# Root Map

This is an index of roots. Detailed translation notes should live in the
root-specific subdirectories.

## Unix

The public tool protocol:

- commands
- pipes
- stdin/stdout/stderr
- exit codes
- process isolation
- environment variables
- working directories

Reason for the project:

CLIs are neutral, installable, sandboxable, inspectable, and community-friendly.
An AI agent can discover a CLI with `--help` and operate it the same way a
human would.

See `unix/cli-protocol.md`.

## Bash

The shell workflow root:

- `read`
- IFS splitting
- byte stream position
- partial consumption
- passing remaining input to the next tool

This motivates cursor work because Node streams and decoders do not naturally
support exact Bash-style byte/codepoint interop.

See `bash/read-and-ifs.md`.

## Azure CLI

The command UX root:

- nested command categories
- consistent help
- grouped options
- predictable output controls
- discoverable command tree

This informs the `cli-*` packages.

See `azure-cli/command-hierarchy.md`.

## C# Reflection and Attributes

The runtime metadata root:

- declarations attached to classes/members
- runtime inspection
- documentation generation
- loader-driven behavior

This informs `partial-*`, `cli-*`, and function contracts.

See `csharp/custom-attributes.md`.

## C# Partial Types and Interfaces

The composition root:

- partial classes
- interfaces
- declared contracts
- runtime-like reflection feel

This informs `PartialClass`, `Concept`, `Attachments`, and the way descriptor
sets are copied into concrete types.

See `csharp/partial-classes-and-interfaces.md`.

## STL

The generic algorithm root:

- iterator categories
- ranges
- containers
- free algorithms
- category-based optimization
- templates and type parameters

This informs `cursor-*`.

Local mapping:

```text
iterator category -> CursorConcept hierarchy
range             -> begin/end range objects
algorithm         -> free cursor algorithms
container         -> cursor-container storage types
view              -> cursor-view
adapter           -> cursor-adapter
```

See `stl/iterator-categories.md`, `stl/algorithms.md`, and
`stl/requires-expressions.md`. See `stl/templates.md` for the emerging
`generic(..., T => contract(...))` mapping.

## XSD

The constraint root:

- simple types
- restriction
- facets
- lists
- unions
- derived named types

This informs `Check`, future `[Restrictions]`, and metadata-driven validation
that can also generate docs.

See `xsd/simple-type-restrictions.md`.

## Trello

The human workflow root:

- cards
- lists
- visible state
- comments
- attachments
- approval
- history

The long-term workflow front end could use Trello or a Trello-like surface as
the durable human control plane.

See `trello/workflow-cards.md`.

## NPM

The distribution root:

Small JavaScript CLIs can be published, installed, versioned, and composed.
This makes tool contribution feel neutral instead of requiring a bespoke agent
plugin ecosystem.

See `npm/tool-distribution.md`.
