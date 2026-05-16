# Meta-Prototype Chain TOC

## Spine Notes

- `README.md`: thesis and documentation policy.
- `catalog.md`: compact map of transforms.

## Transform Tree

The transforms are best read as a tree. Each branch either builds a new chain
or projects a transformed chain into behavior, validation, or documentation.

```txt
Es6Reflector
├─ transforms/es6-static-prototype.md
│  └─ static class descriptors become an instance-like chain
│
└─ PartialReflect
   ├─ transforms/partial-linearization.md
   │  └─ runtime prototype chain expands to include partial types
   │
   ├─ transforms/compiled-descriptors.md
   │  └─ each partial type may compile descriptors before merge
   │
   ├─ transforms/transparent-attachments.md
   │  └─ transparent descriptor groups merge into their host link
   │
   ├─ PartialMetadata
   │  ├─ transforms/partial-metadata.md
   │  │  └─ partial instance chain maps to static metadata fields
   │  │
   │  └─ transforms/condition-chains.md
   │     └─ metadata POJOs expand into member condition chains
   │
   ├─ transforms/reflection-info.md
   │  └─ transformed chains project into TypeInfo and MemberInfo
   │
   └─ transforms/shape-observation.md
      └─ declarations guide observational duck checks over wild values
```

## Transform Notes

- `transforms/es6-static-prototype.md`: static members are copied onto a
  parallel prototype chain so normal instance-reflection algorithms can query
  class statics.
- `transforms/partial-linearization.md`: partial type composition is
  linearized into a meta-prototype chain with last-declaration-wins precedence.
- `transforms/compiled-descriptors.md`: partial type descriptors are compiled
  before entering the chain, enabling concepts to turn declarations into
  abstract requirements.
- `transforms/transparent-attachments.md`: transparent attachment parts
  contribute members without becoming visible associated partial types.
- `transforms/partial-metadata.md`: the partial instance chain is transformed
  into a metadata chain containing static field descriptors.
- `transforms/condition-chains.md`: metadata POJOs such as `[Preconditions]`
  and `[Postconditions]` are expanded into callable member-condition chains.
- `transforms/reflection-info.md`: transformed chains are projected into
  `TypeInfo` and `MemberInfo` for documentation and tooling.
- `transforms/shape-observation.md`: strict shape declarations are tested
  against wild JS values using observational structural probes.
