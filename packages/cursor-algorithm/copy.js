import { assert } from '@kingjs/assert'
import { ContiguousCursorConcept } from '@kingjs/cursor'

function memcopy(target, begin, end) {
  assert(target instanceof ContiguousCursorConcept)
  assert(begin instanceof ContiguousCursorConcept)
  assert(begin.spanType == target.spanType)
  assert(begin.index <= end.index)

  const targetSpan = target.span()
  const sourceSpan = begin.span(end)
  targetSpan.set(sourceSpan)

  return end.index - begin.index
}

export function copy(target, begin, end) {
  if (target instanceof ContiguousCursorConcept
    && begin instanceof ContiguousCursorConcept
    && begin.spanType == target.spanType) 
    return memcopy(target, begin, end)

  target = target.clone()
  begin = begin.clone()

  let count = 0
  while(!begin.equals(end)) {
    target.value = begin.value
    begin.step()
    target.step()
    count++
  }
  return count
}