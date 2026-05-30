# Models

Models are simplified views of code that make one axis inspectable. They are
durable when the view exposes asymmetry, vocabulary pressure, or a design rule
worth preserving.

## Model Types

[Model Types](model-types.md) records reusable model shapes:

- [Chipping Model](model-types.md#chipping-model): repeated binary pivots that add width.
- [Factor Model](model-types.md#factor-model): select-many factor rows pivoted by factor.

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
- [Non-Public Members](container-part.model.md#non-public-members): `$` members chip-pivoted by assert/abstract role, then pivoted by Part.

**Name Model**

- [Name Basis](container-part.model.md#name-basis): members pivoted by STL name basis.
- [Overload Names](container-part.model.md#overload-names): members pivoted by JS overload-name pressure.

**Call Shape**

- [Signature Shape](container-part.model.md#signature-shape): members pivoted by exact parameter shape.
- [Default Arguments](container-part.model.md#default-arguments): members with defaults pivoted by declaration Part.
- [Argument Transforms](container-part.model.md#argument-transforms): members with runtime argument transforms pivoted by family, host, and member.
- [Argument Order](container-part.model.md#argument-order): members pivoted by STL argument order basis.
- [Argument Role](container-part.model.md#argument-role): members pivoted by fuzzy argument role.

**Indexes**

- [Member Index](container-part.model.md#member-index): members pivoted by member with container columns.
- [Lexeme Index](container-part.model.md#lexeme-index): member lexemes pivoted by lexeme with container columns.

[Container Part Indexes Generator](container-part-indexes.generator.md) records
the data and script used to regenerate the `Members`, `Member Index`, and
`Lexeme Index` column grids.

## Partial Types

[Partial Type Model](partial-type.model.md) records partial-type family policy:

- [Family Policy](partial-type.model.md#family-policy): partial-type families pivoted by declared family policy.

## Prototype

[Prototype Protocol Model](../../packages/prototype/model.md) records Prototype reflection
surface pivots:

- [Member Role](../../packages/prototype/model.md#member-role): Prototype members chip-pivoted by access role.
- [Return Type](../../packages/prototype/model.md#return-type): Prototype members chip-pivoted by return type.
- [Generators](../../packages/prototype/model.md#generators): Prototype generators chip-pivoted by member family.
- [Resolution](../../packages/prototype/model.md#resolution): access members pivoted by resolution stage.
- [Split Accessors](../../packages/prototype/model.md#split-accessors): access members pivoted by split-accessor awareness.
- [Access Shape](../../packages/prototype/model.md#access-shape): access members chip-pivoted by singular/plural shape.
- [Option Name](../../packages/prototype/model.md#option-name): Prototype members pivoted by option name.
- [Shared Option Type](../../packages/prototype/model.md#shared-option-type): shared Prototype options chip-pivoted by option type.
- [Member Lexeme](../../packages/prototype/model.md#member-lexeme): Prototype members pivoted by shared name lexeme with singleton lexemes retained as Remainder.
