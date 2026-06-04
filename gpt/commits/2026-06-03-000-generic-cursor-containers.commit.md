# Generic Cursor Containers

Cursor containers are now generic families rather than fixed concrete types. A
container definition is a specialization function over the type parameters that
matter to its surface: sequence containers specialize over their value type,
maps distinguish key type from mapped type, and vectors specialize over both
their logical value type and the typed-array representation that stores it.

The important policy is that generic parameters describe the public container
contract first. Storage details can follow, but they do not get to rename the
container's logical surface. For maps this keeps the STL tension: the container
has a `valueType` for iteration, while `mappedType` names the value supplied to
keyed mutation. For vectors this gives the one place where storage
representation is semantically visible: the typed array determines contiguous
exposure, default value, capacity units, and span type.

Simple type algebra keeps these constraints readable. `AllOf` and `AnyOf`
compose type predicates, `OptionalOf(Type)` means `undefined | Type`, and
`ConstructsOf(Type)` means a constructor whose prototype satisfies `Type`.
Richer constraints are spelled by composition:

```js
ConstructsOf(AllOf(Pushable, Poppable))
OptionalOf(AnyOf(String, Number))
```

The standard cursor-container package provides ordinary names for common
specializations. The generic package remains available for callers that want to
choose their own aliases or specialize directly.

Vector typed-array support is the concrete pressure point for this checkin.
Typed array behavior now lives behind probe and simple-type constraints rather
than a vector-local whitelist, so `VectorOf(Number, Uint8Array)` and
`VectorOf(BigInt, BigInt64Array)` are both checked as generic specializations
instead of one-off subclasses.

There are no partial loader changes. Generic specialization happens before a
type enters the partial system, so the partial loader continues seeing ordinary
concrete types with ordinary Part declarations.

## Impact

- Cursor containers become generic families with cached specializations.
- Container parts specialize over logical value/key/mapped types.
- `@kingjs/cursor-container-standard` exports the common concrete container
  names.
- `@kingjs/generic` replaces the older template helper.
- `@kingjs/simple-type` gains `AllOf`, `AnyOf`, `OptionalOf`, and
  `ConstructsOf` as composable metadata types.
- Typed-array probing moves into `@kingjs/probe-typed-array`.
- Promise-style probing moves into `@kingjs/probe-promise`.
- Vector storage tests move to the standard package where the public aliases
  live.
