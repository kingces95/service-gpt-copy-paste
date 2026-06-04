import { contract } from '@kingjs/function-contract'
import { ReadableRangeShape } from '@kingjs/cursor-shape'

export const front = contract([ 
  ReadableRangeShape
], function front(range) {
  const cursor = range.begin()
  return cursor.value
})
