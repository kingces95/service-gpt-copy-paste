import { assert } from '@kingjs/assert'
import { overload } from '@kingjs/function-contract'
import {
  ContiguousCursorShape,
  ContiguousRangeProbe,
  ForwardCursorShape,
  OutputCursorShape,
  ReadableRangeProbe,
  spanTypeOfRange,
  spanTypeOfCursor,
  WritableContiguousCursorShape,
} from '@kingjs/cursor-shape'

function memcopy(target, begin, end) {
  assert(target instanceof WritableContiguousCursorShape)
  assert(begin instanceof ContiguousCursorShape)
  assert(begin.spanType == target.spanType)
  assert(begin.index <= end.index)

  const targetSpan = target.span()
  const sourceSpan = begin.span(end)
  targetSpan.set(sourceSpan)

  return end.index - begin.index
}

export const copy = overload([
  [ OutputCursorShape, ForwardCursorShape ],
  ReadableRangeProbe,
], [
  {
    when: [
      WritableContiguousCursorShape,
      ContiguousRangeProbe,
    ],
    where(target, range) {
      return spanTypeOfRange(range) == spanTypeOfCursor(target)
    },
    use: function copyContiguous(target, range) {
      return memcopy(target, range.begin(), range.end())
    },
  },
],
function copy(target, range) {
  const begin = range.begin()
  const end = range.end()

  target = target.clone()

  let count = 0
  while(!begin.equals(end)) {
    target.value = begin.value
    begin.step()
    target.step()
    count++
  }
  return count
})
