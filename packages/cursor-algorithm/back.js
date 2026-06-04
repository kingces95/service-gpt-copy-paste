import { contract } from '@kingjs/function-contract'
import { BidirectionalRangeShape } from '@kingjs/cursor-shape'

export const back = contract([
  BidirectionalRangeShape
], function back(range) {
  const cursor = range.end()
  cursor.stepBack()
  return cursor.value
})
