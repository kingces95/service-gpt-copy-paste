# Transparent Root Copy

### Created 2026-05-21

## Impetus

`Shape` gained the ability to use `[Implements]` as a descriptor source:

```js
class MyConcept extends Concept {
  method() { }
}

class MyShape extends Shape {
  static [Implements] = MyConcept
}
```

That worked for descriptor reuse, but the first implementation accidentally
published `MyConcept` as nominal composition when `MyShape` was copied to a
normal type.

The original proof test lived in the retired `packages/partial-satisfy`
package: satisfying a shape backed by a concept should copy the concept
descriptor, should satisfy the shape structurally, and should not make the
instance an instance of the concept. The current package boundary keeps the
transparent-root rule but queries shape satisfaction directly in
`@kingjs/partial-shape`.

## Rule

Transparent roots copy descriptors but do not publish non-transparent hosts.

```txt
copyTo(MyShape, MyType)
├─ MyShape is transparent
├─ MyShape may preserve its internal provenance
├─ MyConcept descriptors may be copied
└─ MyConcept must not be published to MyType
```

The local guard is intentionally not recursive:

```js
if (!isTransparent(partialType) && !isTransparent(host))
  adjacentTypes.publish(host)
```

The first check asks about the root being copied. If the root is transparent,
then every host reached through that copy is being used as structural
descriptor material only.

The second check asks about the current host. Even when the root is
non-transparent, transparent hosts should not be published as nominal
composition.

## Why This Is Subtle

When reflecting a transparent type itself, its full poset can remain visible:

```txt
MyShape
└─ MyConcept
```

That provenance is useful metadata. It explains where the structural
requirement came from.

But when copying that transparent type onto a normal target, the transparent
root is acting like a structural descriptor bundle. Its provenance should not
leak into the target's nominal meta-prototype chain.

So there are two different views:

```txt
reflect Shape itself
└─ preserve provenance

copy Shape to normal target
└─ copy descriptors
└─ suppress nominal publication
```

## Design Pressure

An attempted simplification avoided retrieving the adjacent-types cache for
transparent roots. That made publication impossible, but it also broke
`DependsOn` checks because the same cache is used to answer dependency queries.

The cache therefore has two jobs:

```txt
AdjacentTypes
├─ dependency query context
└─ publication sink
```

The guard belongs at publication time, not cache acquisition time.

## Related

- [Partial Shape and Satisfy](./2026-05-20-004-partial-shape-and-satisfy.notes.md)
- [Partial Shape Design](./2026-05-20-003-partial-shape-design.notes.md)
- [STL Mechanical Translation](./2026-05-21-001-stl-mechanical-translation.notes.md)
