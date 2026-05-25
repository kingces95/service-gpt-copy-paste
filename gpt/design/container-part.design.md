# Container Part Design

This note captures the division of labor that the code can suggest but cannot
fully enforce.

## Invariant

Container behavior is declared by role Parts, not by concrete containers.

Any member that can be declared, checked, or defaulted by a Part belongs in a
Part. A concrete container should keep only the storage-specific mechanics that
make that behavior work for its representation.

That gives the families a stable division of labor:

```txt
Concepts   -> public capability surfaces
Parts      -> declarations, reusable defaults, checked/debug behavior
Containers -> concrete storage mechanics
Tests      -> explicit capability claims and inherited/default behavior checks
```

## Evidence

The generated trees, pivots, grids, indices, and support telemetry live in
[container-part.model.md](../models/container-part.model.md). Those pivots can reveal
candidate role names, but this note records the rule for deciding where behavior
belongs.
