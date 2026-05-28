# Contract And Descriptor Boundaries

This checkin establishes a common declaration-application path for Partial
families. `extend` and `implement` both pass through
`ApplyDeclaration<TDeclaration, TImplementation>`, so declaration policy is
enforced once instead of being reinterpreted by each verb.

The policy is that a Partial declaration may only provide implementations for
members owned by the declaration it names. That keeps smearing explicit:
concepts declare concept members, parts declare part members, and concrete
types compose those declarations instead of quietly borrowing implementation
authority from adjacent or inherited vocabulary.

One motivating case is cursor movement. A type that extends
`SteppableCursorPart` should not satisfy that declaration by implementing
members owned by some other cursor declaration:

```js
extend(this, SteppableCursorPart, {
  step() { },
  clone() { },
})
```

`clone` belongs with the cloneable declaration, so it must be smeared onto the
matching part instead:

```js
extend(this, SteppableCursorPart, {
  step() { },
})

extend(this, CloneableCursorPart, {
  clone() { },
})
```

That is useful policy because the declaration site becomes a map of member
ownership. If a member moves, the declaration that owns it has to move with it.

```txt
Features
├─ Partial declaration application
│  ├─ unifies extend and implement through ApplyDeclaration<TDeclaration, TImplementation>
│  ├─ restricts declarations to their owning Partial family
│  └─ checks implementation descriptors against declaration descriptors
├─ Contract / thunk boundary
│  ├─ contract(requirements, names?, defaults?, fn?) requires requirements
│  ├─ contract applies defaults only for argument checks
│  ├─ thunk applies defaults and transforms for runtime calls
│  └─ callers compose both stages explicitly when both are needed
├─ Descriptor algebra
│  ├─ Descriptor.equalSlots(left, right)
│  ├─ Descriptor.isAccessorHalfOf(half, whole)
│  └─ Partial policy depends on descriptor facts instead of inline slot logic
├─ Tuple metadata carrier
│  ├─ Tuple.of(...)
│  ├─ positional argument-name carrier for contract
│  └─ disambiguates names from defaults arrays
├─ ES6 declaration helpers
│  ├─ declareName(...)
│  ├─ declareMethod(...)
│  ├─ declareGetter(...)
│  ├─ declareSetter(...)
│  ├─ declareField(...)
│  └─ descriptor syntax report
└─ Type traits
   ├─ sameAs(T)
   ├─ extensionOf(T)
   ├─ derivedFrom(T)
   └─ baseOf(T)
```

The argument pipeline is split into two orthogonal stages:

```txt
contract
├─ requires argument requirements
├─ applies defaults for checks
└─ calls the target

thunk
├─ applies defaults for transforms
├─ applies transforms
└─ calls the target
```

Defaults belong to the stage that consumes them. If both stages need the same
defaults, the shared value is explicit:

```js
const Defaults = [
  undefined,
  defaultTo(({ args: [first] }) => first),
]

const member = contract([Cursor, Cursor], { defaults: Defaults },
  thunk({ defaults: Defaults, transforms }, target))
```

That makes the debug boundary visible: a contract stage can be removed without
removing the thunk stage needed by runtime transforms.

Argument names now have their own positional carrier:

```js
const ApplyDeclarationNames = Tuple.of('type', 'declaration', 'implementation')
```

`Tuple` lets names live in the argument list without colliding with defaults.
Plain arrays remain defaults; Tuple arrays are names.

The Partial declaration policy is expressed over descriptor algebra:

```txt
declaration supports implementation
├─ equal descriptor slots
└─ accessor half of a whole accessor
```

The algebra lives in `@kingjs/descriptor`:

```txt
Descriptor
├─ equalSlots(left, right)
│  ├─ ValueDescriptor.equalSlots(left, right)
│  └─ GetSetDescriptor.equalSlots(left, right)
└─ isAccessorHalfOf(half, whole)
   └─ GetSetDescriptor.isAccessorHalfOf(half, whole)
```

The Partial layer owns the policy; the descriptor layer owns only descriptor
facts.

## Loader Notes

`partial-reflector` now recognizes `Redeclare` as loader metadata. Redeclare is
used by a Partial family to pull selected adjacent-family descriptors into the
unified prototype as if they were declared by the current type.

```txt
unified prototype
├─ redeclared adjacent descriptors
├─ transparent descriptors
└─ own descriptors
```

The loader gathers redeclared adjacent types by family:

```txt
ownRedeclaredPartialTypes(type)
├─ read families from type[Redeclare]
├─ enumerate declared adjacent partial types
├─ project each adjacent type to its Partial family
└─ yield adjacent types whose family is redeclared
```

`mergeOrder` now accepts a forest instead of a single root. That lets the
unified prototype reduce redeclared types before transparent types without
inventing a separate merge path:

```txt
mergeOrder(...redeclaredTypes)
mergeOrder(...transparentTypes)
type
```

This keeps the loader aware of symbols, not Partial family policy. Families
declare which adjacent families are redeclared; the reflector only turns that
metadata into descriptor order.
