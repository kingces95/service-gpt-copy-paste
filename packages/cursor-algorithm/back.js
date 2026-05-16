import { contract } from '@kingjs/function-contract'
import { BidirectionalCursorConcept } from '@kingjs/cursor'

export const front = contract([ 
  BidirectionalCursorConcept 
], function back(container) {
  const cursor = container.end()
  cursor.stepBack()
  return cursor.value
})
