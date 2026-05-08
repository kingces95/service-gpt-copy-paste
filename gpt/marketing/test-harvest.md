# Test Harvest

Tests can be treated as raw ore for marketing documentation.

The compile step is:

1. scan focused tests by package family
2. identify assertions with a developer-facing payoff
3. translate the assertion into an idiom note candidate
4. keep the source test nearby as evidence

Good candidates usually have one of these shapes:

- "this metadata loads into behavior"
- "this concept can be checked at runtime"
- "this parser shape turns text into structure"
- "this cursor category unlocks a faster algorithm"
- "this reflection result can become help or docs"
- "this resource protocol prevents lifecycle mistakes"

## Current Harvest Notes

### Partial And Concept Tests

- `packages/partial-concept/instanceof.test.js`: market as "runtime
  `instanceof` for named concepts", where a type opts into a concept rather
  than merely having matching members by accident.
- `packages/partial-concept/unit.test.js`: market as "abstract by descriptor",
  where empty method/getter/setter declarations compile into abstract
  requirements.
- `packages/partial-concept/integration.test.js`: market as "kitchen sink to
  POJO", showing that a rich concept declaration can be reflected into stable
  documentation data.
- `packages/partial-class/unit.test.js`: market as "composition with a paper
  trail", where extension declarations survive inheritance and remain visible.
- `packages/partial-extend/thunk.test.js`: market as "conditions around copied
  members", where lifecycle hooks or preconditions can wrap partial
  application.

### Cursor Tests

- `packages/cursor/cursor.test.js`: market as "iterator category upgrades",
  where a cursor can satisfy input, output, forward, bidirectional, random
  access, and contiguous concepts.
- `packages/cursor-algorithm/unit.test.js`: market as "algorithm dispatch by
  capability", where `distance` can use random access without advancing the
  cursor and still fall back to stepping.
- `packages/cursor-container/container.test.js`: market as "STL containers in
  JavaScript clothing", where begin/end cursors provide the common algorithm
  surface.
- `packages/cursor-container/adapter/sliding-window/unit.test.js`: market as
  "adapters that make streams look like containers", bridging Unix-ish streams
  with STL-ish traversal.

### CLI Tests

- `packages/cli-parser/unit.test.js`: market as "read-style parsing from
  metadata", where tuple, named, list, discriminator, and comment metadata turn
  a line into structured data.
- `packages/cli-field-type/unit.test.js`: market as "tiny field schemas for
  shell input", where `word`, `number`, `boolean`, comments, enums, aliases,
  and parse defaults are all reflected.
- `packages/cli-shell/unit.test.js`: market as "commands as composable process
  protocols", closer to Bash than a hidden SDK call.
- `packages/cli-process/unit.test.js`: market as "process boundaries as a tool
  API", where a CLI can become something an AI can inspect, execute, and
  compose.
- `packages/cli-disposer/unit.test.js`: market as "resource disposal you can
  trust in pipelines", where stream lifecycle rules are explicit and checked.

### Reflection Tests

- `packages/info/concept.unit.test.js`: market as "runtime reflection that sees
  concepts", where members, symbols, private names, and concept declarations
  can become docs.
- `packages/info/partial-class.unit.test.js`: market as "partial composition
  as inspectable architecture", not just copied prototype members.
- `packages/info-to-pojo/unit.test.js`: market as "reflection data you can ship
  to help, docs, or tooling."
- `packages/es6-info/*.test.js`: market as "JavaScript descriptors normalized
  into a documentation model."

### Unicode And Stream Tests

- `packages/byte-sliding-window/unit.test.js`: market as "cursor traversal over
  bytes", with forward/backward stepping, slices, and read limits.
- `packages/unicode-sliding-window/unit.test.js`: market as "codepoint windows
  with byte-position accountability", including BOM and endian handling.
- `packages/char-decoder/unit.test.js`: market as "incremental decoding with
  sharp error boundaries", useful for Bash-like `read` behavior over byte
  streams.
- `packages/stream-sip/unit.test.js`: market as "sip, parse, and hand the rest
  forward", the Unix interop story in miniature.
