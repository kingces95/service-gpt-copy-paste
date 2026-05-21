# Meta-Prototype Chain TOC

## Spine Notes

- `README.md`: thesis and documentation policy.
- `catalog.meta.md`: compact map of transforms.

## Transform Tree

The transforms are best read as a tree. Each branch either builds a new chain
or projects a transformed chain into behavior, validation, or documentation.

```txt
Es6Reflector
├─ transforms/es6-static-prototype.meta.md
│  └─ static class descriptors become an instance-like chain
│
└─ PartialReflect
   ├─ transforms/partial-linearization.meta.md
   │  └─ runtime prototype chain expands to include partial types
   │
   ├─ transforms/compiled-descriptors.meta.md
   │  └─ each partial type may compile descriptors before merge
   │
   ├─ transforms/transparent-attachments.meta.md
   │  └─ transparent descriptor groups merge into their host link
   │
   ├─ PartialMetadata
   │  ├─ transforms/partial-metadata.meta.md
   │  │  └─ partial instance chain maps to static metadata fields
   │  │
   │  └─ transforms/condition-chains.meta.md
   │     └─ metadata POJOs expand into member condition chains
   │
   ├─ transforms/reflection-info.meta.md
   │  └─ transformed chains project into TypeInfo and MemberInfo
   │
   ├─ transforms/probe-observation.meta.md
   │  └─ declarations guide observational duck checks over wild values
   │
   └─ transforms/shape-satisfaction.meta.md
      └─ declarations guide structural checks over constructor types
```

## Transform Notes

- `transforms/es6-static-prototype.meta.md`: static members are copied onto a
  parallel prototype chain so normal instance-reflection algorithms can query
  class statics.
- `transforms/partial-linearization.meta.md`: partial type composition is
  linearized into a meta-prototype chain with last-declaration-wins precedence.
- `transforms/compiled-descriptors.meta.md`: partial type descriptors are compiled
  before entering the chain, enabling concepts to turn declarations into
  abstract requirements.
- `transforms/transparent-attachments.meta.md`: transparent attachment parts
  contribute members without becoming visible associated partial types.
- `transforms/partial-metadata.meta.md`: the partial instance chain is transformed
  into a metadata chain containing static field descriptors.
- `transforms/condition-chains.meta.md`: metadata POJOs such as `[Preconditions]`
  and `[Postconditions]` are expanded into callable member-condition chains.
- `transforms/reflection-info.meta.md`: transformed chains are projected into
  `TypeInfo` and `MemberInfo` for documentation and tooling.
- `transforms/probe-observation.meta.md`: probe declarations are tested against
  wild JS values using observational structural probes.
- `transforms/shape-satisfaction.meta.md`: shape declarations are tested against
  constructor prototypes using structural descriptor checks.
