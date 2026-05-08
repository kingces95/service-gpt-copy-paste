# Meta-Prototype Chain

## Original Idea

JavaScript has a runtime prototype chain. C# reflection can see declared type
metadata. Multiple inheritance systems linearize a graph of base types.

The partial system combines these ideas: a class has its normal ES prototype
chain, plus a meta-prototype chain that inserts partial types into the order in
which their descriptors should be understood.

## Local Model

If a type `T` extends `B` and composes partial types `P0`, `P1`, the logical
tree is:

```text
T
├─ P1
├─ P0
└─ B
```

The reflector linearizes the tree, dedupes duplicate partials keeping the last
declaration, and reduces descriptors into a prototype.

## Why This Matters

The meta-prototype chain lets normal reflection-like algorithms answer partial
questions:

- which member came from which partial type?
- which partial type overrides another?
- which concepts are present?
- which static metadata applies?

This is the core reason `partial-*` can feel like runtime C# reflection even
though JavaScript has no native partial class or interface system.
