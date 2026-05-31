# Shape Requirement Graph

Quest:

Clarify whether Shape should remain a transparent flattened descriptor surface
or become a preserved requirement graph.

Current reality:

```txt
Shape
├─ Includes -> Shape
└─ Implements -> Concept
```

`instance instanceof Shape` currently checks a collapsed strict duck surface.
That makes `Includes` a construction device rather than a relation with runtime
meaning.

Candidate policy:

```txt
Shape satisfaction
├─ own Shape members: strict duck check
├─ included Shapes: recursive Shape check
└─ implemented Concepts: composedOf check
```

Implication:

Shape may not want `Transparent` semantics. If Shape is a requirement graph,
its `Includes` and `Implements` edges should remain visible to the matcher
instead of being flattened away during prototype construction.

Keep separate from declaration cleanup:

`[Normalize]` should stay a generic family normalizer. Shape should not need
special handling in the declaration assertion path.
