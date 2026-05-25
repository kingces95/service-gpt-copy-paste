# Models

Models are simplified views of code that make one axis inspectable. They are
durable when the view exposes asymmetry, vocabulary pressure, or a design rule
worth preserving.

## Container Parts

[Container Part Model](container-part.model.md) records the current
STL-inspired container surface through a set of pivots:

- [Lexicon](container-part.model.md#lexicon): role terms with short definitions.

**Part Structure**

- [Hierarchy](container-part.model.md#hierarchy): Parts pivoted by primary inheritance.
- [Facets](container-part.model.md#facets): Parts pivoted by secondary composition.
- [Roles](container-part.model.md#roles): Parts pivoted by behavioral family.
- [Part Lexeme](container-part.model.md#part-lexeme): Part names pivoted by shared lexeme.
- [Support](container-part.model.md#support): Parts pivoted by container support.

**Part Members**

- [Members](container-part.model.md#members): members pivoted by Part with container columns.
- [Overrides](container-part.model.md#overrides): inherited members pivoted by implementation host.
- [Preconditions](container-part.model.md#preconditions): members pivoted by reusable assertion member.

**Name Model**

- [Name Basis](container-part.model.md#name-basis): members pivoted by STL name basis.
- [Overload Names](container-part.model.md#overload-names): members pivoted by JS overload-name pressure.

**Call Shape**

- [Signature Shape](container-part.model.md#signature-shape): members pivoted by exact parameter shape.
- [Argument Order](container-part.model.md#argument-order): members pivoted by STL argument order basis.
- [Argument Role](container-part.model.md#argument-role): members pivoted by fuzzy argument role.

**Indexes**

- [Member Index](container-part.model.md#member-index): members pivoted by member with container columns.
- [Lexeme Index](container-part.model.md#lexeme-index): member lexemes pivoted by lexeme with container columns.

[Container Part Indexes Generator](container-part-indexes.generator.md) records
the data and script used to regenerate the `Members`, `Member Index`, and
`Lexeme Index` column grids.
