# Chris-ish Design Style

## Translation Over Invention

Prefer ideas that map from mature systems instead of new abstractions invented
from scratch.

Good suggestions usually start by identifying the root:

- "This is like STL iterator categories."
- "This is like XSD simple type restriction."
- "This is like C# reflection/attributes."
- "This is like Bash `read` and IFS."
- "This is like Azure CLI command groups."

Then translate the root into JavaScript, metadata, descriptors, loaders, and
runtime reflection.

## Metadata First

Start with what the declaration should look like, then build the loader that can
understand it.

Preferred metadata building blocks:

- Type
- POJO
- Array
- primitive
- symbol
- function when useful as graceful fallback

Avoid helper DSLs when the metadata itself can be declared directly.

Example preference:

```js
materialize[Preconditions] = [
  null,
  null,
  [
    DefaultConstructible,
    PushBackContainer,
  ],
]
```

This is preferred over a fluent builder because the declaration is already the
artifact to reflect, validate, and document.

## Runtime Reflection Is a Feature

TypeScript overlap is acceptable, but the project values runtime metadata
because it can drive:

- `--help`
- docs
- validation
- command discovery
- AI tool use
- workflow history
- generated UI

Types that evaporate at runtime do not solve the whole problem.

## Separate Metadata Dimensions

Prefer keeping distinct validation dimensions separate instead of mushing them
into one metadata object.

Examples:

```text
TypePreconditions
  receiver-wide checks for every member

Preconditions
  receiver checks for one member

ArgChecks
  runtime argument checks for one member

generic/template checks
  type/template parameter checks
```

For generic functions, a C++-template-inspired shape is acceptable:

```js
export const materialize = generic(
  [PushBackContainerShape],
  [VectorMap],
  T => contract(
    [InputRange],
    function materialize(range) {
      const result = new T()
      return result
    }
  )
)
```

This allows defaults and template checks to pull double duty by dimension:

```text
generic defaults  -> default template parameters
contract defaults -> default runtime arguments

generic checks    -> template/type parameter requirements
contract checks   -> runtime argument requirements
```

Use single capital names like `T` for template parameters when it clarifies the
lineage.

## Tests As First-Touch Feedback

Tests should often begin as root POJOs that declare the interesting dimensions
of a surface. For example, a `Containers` object can declare container
constructors and an `Algorithms` object can declare algorithm cases.

Then wring procedural logic out of those POJOs:

- keep fixture construction in the container declaration
- make each case become its own `it(...)` clause
- use runtime `instanceof` concept checks to select which types support a case
- let the test shape expose missing concepts, awkward APIs, or useful new
  idioms

This makes tests part of the design loop, not just verification. A good matrix
test should pressure the source code toward better declarations while also
being easy to harvest into documentation or marketing examples.

## Graceful Fallbacks

Use declarative metadata where possible and pretty. Allow procedural fallback
when an idea is experimental, local, or not worth naming yet.

The likely evolution is:

```text
inline procedural check
  -> type with Symbol.hasInstance
  -> reusable restriction/facet
  -> documented public concept or part, if it earns the weight
```

The current contract loader should stay agnostic and only understand ordinary
slot checks:

```js
value instanceof type
```

Custom behavior belongs behind the type's `Symbol.hasInstance`, not in a
well-known procedural branch in the loader.

Keep defaults out of `contract`; defaults belong to the caller, the function
signature, or the template/export choice. The contract layer should remain:

```js
contract(types, fn)
```

## Small Sharp Packages

The repo favors many small packages with narrow names and simple `index.js`
exports. New infrastructure should usually begin as a small package if it has a
clear boundary.

Recent example:

- `@kingjs/function-contract`
- `@kingjs/cursor-checks`
- `@kingjs/weak-map-lookup`
- `@kingjs/metadata`
- `@kingjs/templatize`
- `@kingjs/constructs`

When a helper is really just a primitive operation, keep it honest. For
example, `WeakMapLookup` does not pretend to be a cache; it maps an object tuple
to a leaf `WeakMap`. The cache policy lives in the caller.

Prefer explicit `.as(...)` for template application when that honesty helps
prevent the system from becoming too magical:

```js
Constructs.as(PushBackContainer)
Materialize.as(VectorMap)
```

Use the generated type name to carry the generic flavor:

```text
ConstructsOf extends Constructs
```

Template specializations should expose frozen `.targs` for reflection. Function
specializations may keep `.as` for ergonomic re-instantiation; type
specializations should not expose `.as` unless that is explicitly part of their
public surface.

Hoist inert metadata behavior into a tiny common base:

```js
class Metadata {
  constructor() {
    throw new TypeError('Metadata cannot be instantiated.')
  }
}
```

## Naming Taste

Use names from the source tradition when they clarify the mapping.

Examples:

- `Concept`
- `PartialClass`
- `Attachments`
- `Restrictions`
- `Check`
- `Range`
- `Cursor`
- `ContainerPart`

Prefer standard spellings from programming literature:

- `Constructible`, not `Constructable`

## Concepts, Parts, Shapes, Checks

Use these at different levels:

```text
Concept
  public certified semantic vocabulary

Part
  internal capability bundle / implementation composition unit

Shape
  anonymous concept / requires-expression-shaped capability

Check
  argument/value constraint with custom runtime behavior and documentation

Probe
  loose observational check for wild JS values
```

Do not promote every useful member test to a public concept. The bar for a
named public concept is high, similar to STL.

The emerging split is:

```text
Concept
  grand, certified, opt-in vocabulary

Shape
  small, leaf-y, structural requirement that does not need explicit opt-in

Probe
  observational runtime duck test over wild JavaScript values

Check
  procedural validation hook with custom errors and docs
```

This keeps `Shape` close to C++ anonymous `requires` expressions: a named local
bundle of expression requirements, not a public semantic noun unless it earns
that weight.
