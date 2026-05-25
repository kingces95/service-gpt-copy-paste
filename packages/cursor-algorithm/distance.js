import { overload } from '@kingjs/function-contract'
import {
  ReadableRangeProbe,
  RandomAccessRangeProbe,
} from '@kingjs/cursor-shape'

export const distance = overload([
  ReadableRangeProbe,
], [
  {
    when: [ RandomAccessRangeProbe ],
    use: function distanceRandomAccess(range) {
      return range.begin().distanceTo(range.end())
    },
  },
],
function distance(range) {
  const begin = range.begin()
  const end = range.end()

  let count = 0
  while (!begin.equals(end)) {
    begin.step()
    count++
  }
  return count
})
