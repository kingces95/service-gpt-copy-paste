import { contract } from '@kingjs/function-contract'
import { InputCursorConcept } from '@kingjs/cursor'

export const front = contract([ 
  InputCursorConcept 
], function front(container) {
  const cursor = container.begin()
  return cursor.value
})
