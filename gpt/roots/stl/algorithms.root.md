# Free Algorithms

## Original Idea

STL algorithms are free functions over iterator pairs. They are not methods on
containers.

Original style:

```cpp
std::copy(first, last, out);
std::copy_backward(first, last, result);
std::distance(first, last);
std::advance(it, n);
```

The algorithm depends on iterator capabilities, not concrete storage.

## Local Translation

The local equivalent lives in `@kingjs/cursor-algorithm`.

Example style:

```js
import { RandomAccessCursorConcept } from '@kingjs/cursor'

export function distance(range) {
  const begin = range.begin()
  const end = range.end()

  if (begin instanceof RandomAccessCursorConcept)
    return begin.distanceTo(end)

  begin = begin.clone()

  let count = 0
  while (!begin.equals(end)) {
    begin.step()
    count++
  }
  return count
}
```

The local range migration intentionally distinguishes two roles:

```text
source range
└─ values consumed by an algorithm or bulk edit
└─ treated as stable values
└─ snapshotted by `sourceRange$` if it aliases the target container

target slice
└─ positions inside the container being mutated
└─ still commonly represented by cursor pairs such as `erase(first, last)`
```

That is why `copy(target, range)`, `materialize(range)`, `insertRange(pos,
range)`, `assignRange(range)`, and `replaceRange(first, last, range)` are now
range-shaped on the source side, while `erase(first, last)` remains a
cursor-pair operation for the target slice.

## Why It Matters

This keeps containers small and makes behavior reusable across lists, vectors,
views, and adapters. It also preserves the STL expectation that algorithms can
specialize when cursor categories expose stronger operations.
