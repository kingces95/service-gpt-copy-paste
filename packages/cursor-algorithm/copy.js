import { assert } from '@kingjs/assert'
import { ContiguousCursorShape } from '@kingjs/cursor-shape'

function memcopy(target, begin, end) {
  assert(target instanceof ContiguousCursorShape)
  assert(begin instanceof ContiguousCursorShape)
  assert(begin.spanType == target.spanType)
  assert(begin.index <= end.index)

  const targetSpan = target.span()
  const sourceSpan = begin.span(end)
  targetSpan.set(sourceSpan)

  return end.index - begin.index
}

export function copy(target, range) {
  const begin = range.begin()
  const end = range.end()

  if (target instanceof ContiguousCursorShape
    && begin instanceof ContiguousCursorShape
    && begin.spanType == target.spanType) 
    return memcopy(target, begin, end)

  target = target.clone()

  let count = 0
  while(!begin.equals(end)) {
    target.value = begin.value
    begin.step()
    target.step()
    count++
  }
  return count
}
