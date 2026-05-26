# Transform Thunks On Concrete Types

Argument transforms are runtime behavior, but partial types should remain
declarative while they are still being composed. A partial type can extend
another partial type without freezing that intermediate composition into
wrapped functions.

This checkin establishes the invariant that loader-injected transform thunks
are installed only when a partial is copied onto a non-partial, concrete target
type. Partial-to-partial extension copies raw descriptors forward; the final
concrete type receives the thunk.

That keeps transform metadata usable across a partial hierarchy while avoiding
double application:

```txt
TransformPart
└─ member + transform metadata

ExtendedTransformPart
└─ copies member raw

ExtendedTransformType
└─ receives one transform thunk
```

The regression covers the case directly: a transform declared on a base partial,
inherited through an extended partial, and finally applied to a concrete type
runs once, not twice.
