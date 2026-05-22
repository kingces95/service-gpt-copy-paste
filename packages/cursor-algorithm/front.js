import { contract } from '@kingjs/function-contract'
import { ReadableRangeProbe } from '@kingjs/cursor-shape'

export const front = contract([ 
  ReadableRangeProbe
], function front(range) {
  const cursor = range.begin()
  return cursor.value
})
