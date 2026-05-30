# Partial Member Ownership

Quest:

Make partial declarations account for the members they touch.

Policy:

```txt
partial declaration
├─ may define own members
├─ may propagate own members
├─ may not hide base/composed member implementations
└─ must make base/composed obligations visible
```

Current reality:

```txt
Extend Ownership Scan
├─ set: extend(Type, Part, impl) callsites
├─ transform: call -> (Part, impl member)
├─ ownership: Part own members + members of implemented Concept
├─ count: 70 impl-bearing extend callsites
├─ packages
│  ├─ cursor: 3
│  ├─ cursor-container: 58
│  └─ cursor-view: 9
└─ mismatches: none
```

Shared declaration core:

```txt
ApplyDeclaration.as(declarationBase)(type, declaration, implementation)
├─ validate target policy
├─ validate declaration base
├─ normalize implementation to Attachments
├─ validate implementation descriptors against declaration descriptors
├─ copy declaration surface
└─ copy implementation surface
```

Descriptor ownership:

```txt
implementation descriptor
├─ must have a declaration descriptor with the same key
├─ must satisfy the declaration descriptor shape
└─ may implement one accessor half when declaration is a property descriptor
```

Split accessor policy:

```txt
declared accessor half
└─ super-inherits the opposite half into the effective own descriptor
```

`extend(Type, Part, impl)` should only accept members owned by `Part`.
Members owned by a base or composed Part should be implemented by an explicit
declaration of that owning Part.

When a Part depends on base or composed abstract members, those Parts must be
declared on the concrete type before the dependent Part. This documents which
members are implemented locally and which are propagated by the dependent Part.

Example shape:

```js
extend(Type, BulkAssignableContainerPart, {
  get defaultValue$() { return 0 },
})

extend(Type, GapEditableContainerPart, {
  insertRange(cursor, range) { },
  openGap$(cursor, count) { },
  closeGap$(first, last) { },
})

extend(Type, GapAssignableContainerPart)
```

Part declaration order:

```txt
declare obligations before consumers
implement owners where they are declared
compose larger parts after their bases are visible
```

Concrete types should therefore declare base/composed Parts with abstract
members before declaring the dependent Part. For `GapAssignableContainerPart`,
that means `BulkAssignableContainerPart` and `GapEditableContainerPart` appear
before `GapAssignableContainerPart`.

Descriptor precedence:

```txt
own descriptors may overwrite
inherited descriptors fill only
```

A descriptor is inherited when its declaration host is not the Part named in the
current `extend` call. Inherited descriptors behave like defaults: they fill
holes but must not overwrite a concrete descriptor already declared on `Type`.

This makes the nicer ordering safe:

```js
extend(Type, GapEditableContainerPart, {
  insertRange(cursor, range) { },
})

extend(Type, GapAssignableContainerPart)
```

`implement(Type, Concept, impl, stillAbstract)` should likewise account for every
concept member:

```js
implement(Type, Concept, {
  foo() { },
}, {
  bar() { },
  get baz() { },
})
```

The fourth argument declares members that are intentionally still abstract.

Invariant:

```txt
declared member
├─ implemented by owner
├─ propagated by owner
└─ explicitly still abstract
```

Extend invariant:

```txt
extend(Type, Part)
├─ base/composed abstract Parts were already declared on Type
├─ explicitly attached Parts are topologically ordered
├─ impl names belong to Part
├─ own descriptors can define or propagate
└─ inherited descriptors only fill holes
```

`implement` should reject any concept member that is neither implemented nor
listed as still abstract. It should also reject still-abstract declarations that
do not belong to the concept.

Prefer descriptor-shaped declarations over string names so accessors remain
visible:

```js
implement(Type, Concept, {
  get value() { },
}, {
  set value(value) { },
})
```

Why:

Partial implementation currently allows unfinished or misplaced members to be
easy to miss. Making the remaining abstract surface explicit documents what is
still owed at the declaration site. Restricting implementations to owned members
keeps the code shaped like the model and gives future refactors a sharper
invariant to test.

Loader machinery:

```txt
explicit attachment roots
├─ tracked separately from inherited hosts discovered while copying
├─ reject attaching a base Part after an already-attached extension
└─ publish only the roots the caller named
```

Final `instanceof` is not enough. Propagation can make a Type satisfy a Part
without showing whether the concrete declaration site made that Part's
obligations visible.
