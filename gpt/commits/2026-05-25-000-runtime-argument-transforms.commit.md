# Runtime Argument Transforms

This checkin adds `Transforms` as public Partial-system metadata.

```js
import { Transforms } from '@kingjs/partial-symbols'
import { PartialProxy } from '@kingjs/partial-proxy'
```

A Partial type can now declare implementation-local argument rewrites for
members it implements:

```js
class MyPart extends PartialProxy {
  static [Transforms] = {
    insert(cursor, value) {
      return [
        cursor,
        normalize(value),
      ]
    },
  }

  insert(cursor, value) {
    // receives the transformed value
  }
}
```

Or, using per-argument transform slots:

```js
class MyPart extends PartialProxy {
  static [Transforms] = {
    insert: [null, function(value) {
      return normalize(value)
    }],
  }

  insert(cursor, value) {
    // receives cursor unchanged and value normalized
  }
}
```

The policy is that transforms are implementation-local metadata:

- Defaults are signature metadata and may resolve through the member hierarchy.
- Transforms are implementation metadata and resolve only from the local
  implementation host.
- Transforms are not inherited across overrides.
- Any argument rewrite affecting an implementation should be visible on the
  host that owns that implementation.

That establishes the runtime split:

```txt
proxy/check stage: defaults -> checks
implementation stage: defaults -> transforms -> target
```

The container model captures the result as
[Argument Transforms](../models/container-part.model.md#argument-transforms),
pivoted by family, host, and member. Applied here, source-range overlap
protection becomes a local runtime transform instead of a non-public container
member.
