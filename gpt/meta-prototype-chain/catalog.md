# Transform Catalog

This catalog lists the current meta-prototype-chain transforms discovered in
source.

## Quick Map

| Transform | Source | Target | What It Describes |
| --- | --- | --- | --- |
| ES6 static prototype | ES6 constructor/static chain | Prototype chain of static descriptors | Class statics without `Function.prototype` noise |
| Partial linearization | Runtime prototype chain plus partial adjacency | Meta-prototype chain | Runtime composition including partial classes and concepts |
| Compiled descriptors | Partial type descriptors | Compiled prototype link | Concepts, abstracts, and descriptor transforms |
| Transparent attachments | Attachment POJOs and descriptor groups | Host-owned member contribution | Helper members without permanent architectural identity |
| Partial metadata | Partial meta-prototype chain | Static-field metadata chain | Associated types and symbol-attached metadata |
| Condition chains | Metadata chain containing condition POJOs | Member-keyed pre/postcondition chain | Thunkable method/getter/setter guards |
| Reflection info | Transformed reflection queries | `TypeInfo`/`MemberInfo` graph | Docs, help, POJO output, conceptual ownership |
| Shape observation | Shape declaration plus wild value | Runtime `instanceof` result | Duck typing over live JavaScript observations |

## Architectural Pattern

The pattern repeats:

```txt
source declarations
  -> transformed prototype chain
  -> ordinary reflection query
  -> documentation / validation / behavior
```

The transform is the key design artifact. The public API often looks like
reflection, but the value comes from reflecting over a chain that has already
encoded the right semantics.

## Transform Tree

```txt
Es6Reflector
├─ ES6 static prototype
│
└─ PartialReflect
   ├─ partial linearization
   ├─ compiled descriptors
   ├─ transparent attachments
   ├─ PartialMetadata
   │  ├─ partial metadata
   │  └─ condition chains
   ├─ reflection info
   └─ shape observation
```

The important nested branch is `PartialMetadata`: it is not a peer of
`PartialReflect` so much as a transform over the chain `PartialReflect`
already built. Condition chains then transform metadata again by expanding
symbol-attached POJOs into member-keyed guard chains.

## Source Anchors

- `packages/es6-reflector/index.js`: static-chain transform and shared
  reflection operations.
- `packages/partial-reflector/index.js`: partial linearization,
  compiled/unified prototype links, transparent handling, and `copyTo`.
- `packages/partial-metadata/index.js`: metadata and condition-chain
  transforms.
- `packages/partial-proxy/index.js`: thunk creation from condition metadata.
- `packages/info/index.js`: docs/tooling projection over `PartialReflect` and
  `PartialMetadata`.
- `packages/partial-shape/shape.js`: observational shape matching.
