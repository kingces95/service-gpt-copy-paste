import { RandomAccessRangeProbe } from '@kingjs/cursor'

export function distance(range) {
  const begin = range.begin()
  const end = range.end()

  if (range instanceof RandomAccessRangeProbe)
    return begin.distanceTo(end)

  let count = 0
  while (!begin.equals(end)) {
    begin.step()
    count++
  }
  return count
}
