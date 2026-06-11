# Abstraction Basis Search

When an abstraction feels useful but awkward, search for an established
computer-science basis before adding more local policy.

The search pattern:

1. Name the awkward operations and edge cases.
2. List established bases that might already own those shapes.
3. Map the current nouns and verbs onto each basis.
4. Prefer the basis where edge cases become ordinary named behavior.
5. Let that basis supply the public vocabulary, invariants, and tests.

Candidate bases include:

- virtual memory: virtual spaces, pages, materialization, address mapping
- iterators and ranges: cursor categories, range categories, adaptors
- descriptors: declarative records, metadata, normalization
- algebra: products, sums, composition, identities
- typeclasses and concepts: capability witnesses and associated types
- query planning: logical plans, physical plans, pushdown, projection
- operating systems: handles, resources, streams, ownership
- compiler passes: syntax, lowering, IR, optimization, code generation

The cursor range work snapped into focus when it was mapped to virtual
memory. Range containers and Unicode decoders are virtual address spaces over
lower spaces. `pages(end)` exposes lower-space page ranges with a mapping back
to the virtual cursor. `materialize(end)` optionally copies into one lower
range. Search can then recurse through virtual spaces until it reaches a
physical representation that supports a native scan.

This is the useful test: a good basis makes optimizations feel lawful instead
of like abstraction piercing.
