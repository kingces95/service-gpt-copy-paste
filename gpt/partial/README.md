# Partial System

This directory is assistant-facing memory for the `partial-*` packages.

The partial system is the runtime generic-programming substrate of the repo. It
translates ideas from C# partial classes, C# interfaces, C# reflection,
attributes, mixins, duck typing, and C++ concepts into JavaScript descriptors,
symbols, loaders, and runtime reflection.

## One-Sentence Summary

`partial-*` lets JavaScript classes be composed from reflectable descriptor
sets, certified concepts, transparent attachments, runtime conditions, and
metadata-aware loaders.

## Core Translation

Original roots:

- C# partial classes: split a type across declarations.
- C# interfaces: certify that a type satisfies a named contract.
- C# custom attributes: attach reflectable metadata to declarations.
- C++ concepts: express named capability requirements.
- Mixins: copy implementation members into a concrete type.
- Duck typing: test shape when certification is not available.

Local translation:

```text
PartialType
  root for class-shaped metadata/descriptor bundles

Attachments
  transparent descriptor bags

PartialClass
  non-transparent implementation/capability parts

Concept
  certified runtime interface/concept

Shape
  loose observational duck type

PartialReflect
  meta-prototype chain and descriptor copying

PartialProxy
  pre/postcondition thunking
```

## Mental Model

Think of a normal JavaScript class as having one prototype chain. The partial
system builds an additional meta-prototype chain that includes the partial
types a class is composed from.

That lets the repo answer questions like:

- Which partial classes contributed members?
- Which concepts is this type certified to implement?
- Which static metadata did a partial type contribute?
- Which abstract members remain?
- Which preconditions should wrap this method?
- Which descriptors should copy, compile, or remain transparent?

## How To Read This Directory

Start with:

1. `toc.md`
2. `recursive-policy.md`
3. `packages/partial-type/README.md`
4. `packages/partial-reflector/README.md`
5. `packages/partial-concept/README.md`
6. `packages/partial-class/README.md`

Then follow links outward to the smaller verb packages.
