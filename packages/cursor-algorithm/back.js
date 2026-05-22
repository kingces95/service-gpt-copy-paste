import { contract } from '@kingjs/function-contract'
import { BidirectionalRangeProbe } from '@kingjs/cursor-shape'

export const back = contract([
  BidirectionalRangeProbe
], function back(range) {
  const cursor = range.end()
  cursor.stepBack()
  return cursor.value
})
