# Model-Driven Container Parts

This checkin introduces **models**: simplified views of the code that make a
particular axis inspectable.

The work exposes a set of STL-inspired containers as compositions of smaller
Parts. Each Part declares a slice of container behavior: sizing, indexing, front
insertion, phased editing, bulk assignment, associative lookup, and so on. Each
concrete container is then understood as a composition of those Parts.

The main design invariant is the division of labor:

- concepts declare where members come from
- shapes say what algorithms can ask for
- parts hold checked/debug behavior and preconditions
- containers compose the parts they support

The durable artifact is not a rehashing of each change made in this commit. It
is the models: sets of views that explain why the current container surface has
its shape and give future changes something to regress against.

Models captured in this checkin:

- [Container Part Model](../models/container-part.model.md)

The model includes:

**Part Structure**

- Hierarchy: Parts pivoted by primary inheritance.
- Facets: Parts pivoted by secondary composition.
- Roles: Parts pivoted by behavioral family.
- Part Lexeme: Part names pivoted by shared lexeme.
- Support: Parts pivoted by container support.

**Part Members**

- Members: members pivoted by Part with container columns.
- Overrides: inherited members pivoted by implementation host.
- Preconditions: members pivoted by reusable assertion member.
- Non-Public Members: `$` members chip-pivoted by assert/abstract role, then pivoted by Part.

**Name Model**

- Name Basis: members pivoted by STL name basis.
- Overload Names: members pivoted by JS overload-name pressure.

**Call Shape**

- Signature Shape: members pivoted by exact parameter shape.
- Default Arguments: members with defaults pivoted by declaration Part.
- Argument Order: members pivoted by STL argument order basis.
- Argument Role: members pivoted by fuzzy argument role.

**Indexes**

- Member Index: members pivoted by member with container columns.
- Lexeme Index: member lexemes pivoted by lexeme with container columns.
