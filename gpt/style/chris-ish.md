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

## Graceful Fallbacks

Use declarative metadata where possible and pretty. Allow procedural fallback
when an idea is experimental, local, or not worth naming yet.

The likely evolution is:

```text
inline procedural check
  -> named Check class
  -> reusable restriction/facet
  -> documented public concept or part, if it earns the weight
```

## Small Sharp Packages

The repo favors many small packages with narrow names and simple `index.js`
exports. New infrastructure should usually begin as a small package if it has a
clear boundary.

Recent example:

- `@kingjs/function-contract`
- `@kingjs/cursor-checks`

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
  loose observational check for wild JS values

Check
  argument/value constraint with custom runtime behavior and documentation
```

Do not promote every useful member test to a public concept. The bar for a
named public concept is high, similar to STL.
