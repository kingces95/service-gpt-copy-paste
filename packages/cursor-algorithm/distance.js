import { RandomAccessCursorConcept } from '@kingjs/cursor'

export function distance(begin, end) {
  if (begin instanceof RandomAccessCursorConcept)
    return begin.distanceTo(end)

  let count = 0
  while (!begin.equals(end)) {
    if (!begin.step()) throw new Error(
      "Cannot calculate distance: failed to find end.")
    count++
  }
  return count
}
