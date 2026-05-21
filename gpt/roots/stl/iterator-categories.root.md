# Iterator Categories

## Original Idea

The STL classifies iterators by capability. Algorithms ask for the weakest
category that supports their work.

Original style:

```cpp
template<std::input_iterator I>
void consume(I first, I last);

template<std::random_access_iterator I>
auto fast_distance(I first, I last) {
  return last - first;
}
```

Category ladder:

```text
input_iterator
output_iterator
forward_iterator
bidirectional_iterator
random_access_iterator
contiguous_iterator
```

## Local Translation

The local equivalent is the cursor concept hierarchy:

```text
InputCursorConcept
OutputCursorConcept
ForwardCursorConcept
BidirectionalCursorConcept
RandomAccessCursorConcept
ContiguousCursorConcept
```

Example style:

```js
import { implement } from '@kingjs/partial-implement'
import { RandomAccessCursorConcept } from '@kingjs/cursor'

class IndexableCursor extends ContainerCursor {
  static {
    implement(this, RandomAccessCursorConcept, {
      move(offset) { this._index += offset; return this },
      distanceTo(other) { return other.index - this.index },
    })
  }
}
```

## Why It Matters

This lets algorithms dispatch by capability rather than concrete container
type. A generic algorithm can walk forward cursors, while a random-access cursor
can provide a fast path.
