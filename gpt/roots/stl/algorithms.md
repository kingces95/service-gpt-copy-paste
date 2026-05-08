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

export function distance(begin, end) {
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

## Why It Matters

This keeps containers small and makes behavior reusable across lists, vectors,
views, and adapters. It also preserves the STL expectation that algorithms can
specialize when cursor categories expose stronger operations.
