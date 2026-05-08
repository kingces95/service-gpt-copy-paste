# Marketing Notes

This directory collects explanation patterns that make the project easier to
pitch.

The goal is not polished copy yet. The goal is to find compelling examples that
show what the system buys you.

One promising format is:

1. Show an ordinary JavaScript idiom.
2. Show why it is powerful but clunky.
3. Show the same idea as declarative metadata.
4. Explain what the loader/reflection layer can now do with it.

This is especially useful for the partial system because many of its features
are translations of existing JavaScript descriptor idioms into inspectable,
loadable declarations.

## Test Harvesting

Tests are a source of marketing examples. A good test already has the shape of
a tiny story:

1. a setup that names a capability
2. an expectation that proves the capability
3. a failure case that explains why the abstraction matters

As a GPT compile step, periodically scan focused test files and harvest examples
into `toc.md` or future idiom notes. Prefer tests that demonstrate a complete
developer payoff: metadata becomes behavior, reflection becomes documentation,
or a protocol becomes composable.

## Lineage

When an idiom has a strong ancestor in an existing technology, name that
lineage. The marketing is stronger when the reader can think, "I know this
shape already."

Put lineage near the end of an idiom note. The local pain and declarative
upgrade should hit first; the historical analogy is supporting evidence the
reader can mull over after seeing the move.

Good lineage notes should be specific:

- STL associated types, iterator categories, ranges, and algorithms
- C# custom attributes, reflection, interfaces, and partial classes
- XSD simple type restrictions and derivation
- Bash `read`, IFS, process composition, and byte-stream handoff
- Azure CLI command groups, parameters, and generated help

Use lineage when the mapping is tight enough to create familiarity. Avoid
forcing an analogy when the source technology is only a vague inspiration.

Example:

````md
## Lineage

STL uses associated types to let generic code ask an iterator what other types
belong to it.

```cpp
typename iterator_traits<I>::value_type
```

This project translates that move into runtime metadata:

```js
class RangePart extends PartialClass {
  static cursorType = VectorCursor
}
```
````
