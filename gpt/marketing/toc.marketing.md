# Marketing TOC

## Idioms Made Declarative

### Descriptor Idioms

- `idioms/const-field.idiom.md`: turning `Object.defineProperty` for const fields
  into declarative `Defines` metadata.
- `idioms/static-metadata-block.idiom.md`: turning imperative static setup into
  symbol-keyed metadata a loader can consume.
- `idioms/associated-type.idiom.md`: turning related type conventions into
  reflectable associated-type declarations.

### Contract Idioms

- `idioms/abstract-method.idiom.md`: turning hand-written throwing stubs into
  declarative `Abstracts`.
- `idioms/interface-contract.idiom.md`: turning informal method expectations into
  certified `Concept` implementation.
- `idioms/method-precondition.idiom.md`: turning hand-written guard clauses into
  metadata-driven preconditions.
- `idioms/requires-expression.idiom.md`: turning inline capability probes into named
  or anonymous runtime checks.
- `idioms/default-constructible-container.idiom.md`: turning "new Type(); push into
  it" into a named function contract check.
- `idioms/metadata-defaults.idiom.md`: turning function default parameter behavior
  into explicit metadata wrappers can see.

### Composition Idioms

- `idioms/mixin.idiom.md`: turning prototype-copying mixins into `PartialClass`
  extension.
- `idioms/default-helper-method.idiom.md`: turning helper methods bundled with a
  contract into concept `Defines`.

### Runtime Shape Idioms

- `idioms/runtime-duck-check.idiom.md`: turning ad hoc `typeof` checks into reusable
  `Shape`/`Check` declarations.

### Cursor And Container Idioms

- `idioms/algorithm-dispatch.idiom.md`: turning cursor category checks into
  capability-sensitive algorithm fast paths.
- `idioms/materialized-range.idiom.md`: turning a single-pass range into a named,
  explicit buffer when an algorithm needs stronger guarantees.

### CLI And Shell Idioms

- `idioms/read-style-parser.idiom.md`: turning Bash-like `read` expectations into
  metadata-driven line parsing.
- `idioms/field-type-schema.idiom.md`: turning CLI string conversion rules into tiny
  reflected field schemas.
- `idioms/help-from-metadata.idiom.md`: turning command declarations into generated
  help and tool discovery.

### Unix And Stream Idioms

- `idioms/byte-positioned-read.idiom.md`: turning decoded reads into byte-accurate
  stream handoff.
- `idioms/pipeline-resource-disposal.idiom.md`: turning ad hoc stream cleanup into an
  explicit pipeline lifecycle protocol.

### Reflection Idioms

- `idioms/reflection-to-pojo.idiom.md`: turning runtime declarations into stable data
  for docs, help, tests, and tool manifests.

## Future Examples

Potential examples to add, harvested from roots, tests, and recurring
conversation themes.

### Metadata To Behavior

- `idioms/conditions-around-copy.md`: turning "run setup/validation while
  copying members" into declared partial conditions.
- `idioms/symbol-keyed-extension-point.md`: turning private convention names
  into symbol-attached metadata blocks.

### Contracts And Constraints

- `idioms/restriction-type.md`: turning XSD-style simple type restrictions into
  named check derivations.
- `idioms/concept-instanceof.md`: turning `instanceof` from nominal class
  ancestry into certified capability membership.
- `idioms/shape-vs-concept.idiom.md`: showing when loose duck checks are enough and
  when an opted-in concept is the better promise.

### Cursor And Container Stories

- `idioms/iterator-category-upgrade.md`: turning one cursor abstraction into
  input, output, forward, bidirectional, random-access, and contiguous
  capability tiers.
- `idioms/range-as-protocol.md`: turning begin/end pairs into a common surface
  for containers, views, adapters, and algorithms.
- `idioms/contiguous-span.md`: turning a cursor pair into a byte span when a
  container can expose contiguous storage.

### CLI And Shell Stories

- `idioms/nested-command-groups.md`: turning Azure CLI-style nested categories
  into declarative command hierarchy.
- `idioms/cli-as-tool-protocol.md`: turning local executables into neutral,
  inspectable AI tools with no special plugin ceremony.
- `idioms/subcommand-decomposition.md`: turning one CLI into an internal
  process graph using hidden helper commands.

### Unix And Stream Interop

- `idioms/sliding-window-cursor.md`: turning streaming input into a cursorable
  window with forward/backward movement and bounded reads.
- `idioms/incremental-decoder.md`: turning decoder state into an inspectable
  buffer that reports invalid starts and incomplete codepoints precisely.

### Reflection And Documentation

- `idioms/private-member-reflection.md`: turning JavaScript member names,
  symbols, accessors, and private-ish conventions into a normalized info model.
- `idioms/architecture-from-reflection.md`: turning copied members back into a
  visible composition graph.
- `idioms/test-to-marketing.md`: turning focused tests into documentation
  examples as a GPT compile step.
