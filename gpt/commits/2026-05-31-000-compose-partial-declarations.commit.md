# Compose Partial Declarations

Partial declarations use `compose` vocabulary for Part composition, reserving
JavaScript `extends` for lexical class inheritance. The reflection model
describes composition rather than base hierarchy, so Parts form a dependency
graph instead of pretending to be a tree.

Partial member ownership is the center of the policy:

```txt
Partial member ownership
├─ implementations must belong to the declared Concept/Part
├─ intentionally abstract members are explicitly accounted for
├─ inherited descriptors fill holes instead of clobbering concrete impls
├─ split accessors are modeled deliberately
├─ Parts attach in topological order
├─ partial vocabulary uses compose instead of extend
└─ container declarations now follow the concept/part ordering convention
```

The result is a sharper declaration boundary: a Concept or Part owns the
members it declares, a concrete type implements that owned surface, and any
unfinished abstract surface is visible at the declaration site. Concrete
containers follow the same ordering convention:

```txt
Container
├─ static type constants
├─ instance state
├─ constructor and instance helpers
├─ implemented concepts
└─ composed parts
```

`ContainerPart.isEmpty` is specialized only by containers with their own
emptiness basis; sized containers receive `isEmpty` from `SizedContainerPart`.

## Checkpoint Notes

These checkpoint notes record the intermediate policies that led to the
squashed checkin. They are preserved here so the branch can be read as one
coherent decision while still retaining the useful checkpoints.

### Reflect Composition, Not Base Hierarchy

Reflection models runtime surface construction as composition. A reflected type
is made from components, and `isComposedOf(a, b)` means `b` appears in `a`'s
reflected component chain. It does not mean `a === b`.

That keeps the vocabulary split clean:

- JavaScript `extends` remains lexical inheritance.
- Reflection uses composition for the runtime/member surface.
- Type-trait leaves stay strict; broader predicates can be built later by
  combinators such as `or(...)`.

The `Es6Reflector` model records the surface:

- Role pivots members by reflection role.
- Surface Origin separates `Es6Prototype` surface from `Es6Reflector` surface.
- Option Index pivots options by option, then origin, then role.
- Lexeme records strict member-name factors.

The invariant is that "base" language no longer describes reflected structure.
Higher layers such as `PartialReflect` can ask whether one type is composed of
another without reintroducing tree assumptions into a surface that is really a
poset.

### Normalize Partial Family Protocol

Partial families describe their own declaration protocol. A family names the
declarative symbol that hosts its adjacent declarations, the procedural verb
that applies the same relation when one exists, and the normalization rule that
turns declaration input into a family member.

```txt
Family
├─ Declarative
├─ Procedural
├─ Normalize
└─ Adjacent
```

`Adjacent` is a list of accepted adjacent families. The declaration symbol is
recovered from each adjacent family, so declaration edges stay 1-1 with family
protocol.

The invariant is that declaration input is valid when the adjacent family can
normalize it and prove it belongs to that family.

Shape remains deliberately ordinary in this pass: no special declaration rule is
baked into the normalizer. The open question of whether Shape should flatten
into a strict duck surface or preserve a requirement graph is captured as a
quest.

### Compose Partial Classes

Partial composition has its own vocabulary. JavaScript `extends` names lexical
class inheritance; Partial `compose` names attachment into the reflected partial
graph.

```txt
JavaScript Prototype
├─ extends
└─ inherited prototype chain

Partial Reflection
├─ Composes
├─ compose()
└─ composed partial graph
```

The declaration-family table is 1-1 across family type, symbol, and verb:

```txt
Family Type           Symbol           Verb            Adjacent Families
-----------           ------           ----            -----------------
Attachments           Defines          define          -
AbstractAttachments   DefinesAbstract  defineAbstract  -
PartialClass          Composes         compose         Attachments,
                                                       AbstractAttachments,
                                                       PartialClass,
                                                       Concept
Concept               Implements       implement       Attachments,
                                                       Concept
Shape                 Includes         -               Concept,
                                                       Shape
```

`DefinesAbstract` names abstract attachment declarations directly. `Composes`
names partial-class adjacency directly. The public package and verb use the
same word: `@kingjs/partial-compose` exports `compose`.

### Normalize Container Declarations

Concrete containers declare instance shape before public range behavior and
composed container parts. The class body order is:

```txt
Container
├─ static type constants
├─ instance state
├─ constructor and instance helpers
├─ implemented concepts
└─ composed parts
```

`implement(RangeConcept)` belongs with the public member surface.
`ContainerPart.isEmpty` is specialized only by containers with their own
emptiness basis; sized containers receive `isEmpty` from `SizedContainerPart`.
