# Templates

C++ templates are the lineage for separating type parameters from runtime
arguments.

The JavaScript translation is not trying to recreate C++ syntax. It is trying
to preserve the useful distinction:

```txt
template parameters
  checked as types, constructors, or instance-producing factories

runtime arguments
  checked as values passed to the function
```

## Original Shape

In C++, a type parameter is not a runtime argument.

```cpp
template<class T, class R>
requires std::default_initializable<T> &&
  requires(T value) {
    value.push(range_value_t<R>{});
  }
T materialize(R range) {
  T result;
  // ...
  return result;
}
```

Callers can let defaults apply or explicitly instantiate:

```cpp
auto a = materialize(range);
auto b = materialize<std::vector<int>>(range);
```

## JavaScript Translation

JavaScript has no template parameter list, so the type parameter can be bound
through a closure while keeping it out of runtime argument checks.

```js
const Materialize = templatize(
  [PushBackContainerShape],
  T => contract(
    [InputRange],
    function materialize(range) {
      const result = new T()
      // ...
      return result
    }
  )
)

export const materialize = Materialize.as(VectorMap)
```

Public usage:

```js
materialize(range)
materialize.as(VectorMap)(range)
```

The `.as(Type)` form is the explicit instantiation. It avoids overload
ambiguity while still making the template binding visible.

Applied generic metadata can use the same shape:

```js
Constructs.as(PushBackContainerConcept)
```

The `.as(...)` call applies an inert generic metadata family, producing a cached
type such as `ConstructsOf`. The generated type extends `Constructs` and stores
frozen `.targs`; reflection can infer the canonical declaration from the family
type.

Local shape:

```js
export class Constructs extends Metadata {
  static [Symbol.hasInstance](type) {
    for (const requirement of this.targs)
      if (!(type.prototype instanceof requirement))
        return false

    return true
  }
}

templatize(Constructs)
```

Supporting primitives:

```text
WeakMapLookup
  object tuple -> leaf WeakMap

Metadata
  inert base for metadata-only types

templatize
  template definition + type arguments -> cached specialization with .targs
```

## Metadata Dimensions

This keeps metadata dimensions separate:

```txt
template checks
  apply to template variables

contract checks
  apply to runtime arguments

contract defaults
  default runtime arguments
```

That means `T` is lexical inside the implementation, not an extra runtime
argument that participates in `ArgChecks`.

## Shape, Probe, and Template Checks

Earlier sketches let `Shape` pull double duty by dimension:

```txt
Shape in generic(...)
  new T() instanceof Shape

Shape in contract(...)
  arg instanceof Shape
```

The cleaner split is to avoid making `Shape` magical. The current observational
runtime idea should become `Probe`, while `Shape` becomes the smaller
anonymous-concept requirement:

```txt
Probe
  wild-value observational duck test

Shape
  expression requirement / anonymous concept

Concept
  certified opt-in semantic vocabulary
```

That keeps template checks from needing to activate `new T()` just to ask if a
type supports an operation. A `generic(...)` slot can bind `T` against a
`Shape`-like requirement using prototype/descriptor matching, while a
`contract(...)` slot can continue to use ordinary runtime value checks.

The design pressure is the same as C++ templates: template parameters are not
runtime arguments, so their checks should live in a separate metadata dimension.

## Documentation Roadmap

Runtime reflection does not need to solve friendly parameter names immediately.
It can expose enough metadata to be useful:

```txt
Template parameters:
  0: default VectorMap, satisfies PushBackShape

Arguments:
  0: InputRange
```

A later doc compiler can parse the `templatize(..., T => contract(...))` syntax
to pretty-print:

```txt
materialize<T = VectorMap>(range: InputRange)
where T satisfies PushBackShape
```

The first win is simpler: checks move out of procedural code and into named
declarations that can be centralized, reused, localized, and eventually
documented.
