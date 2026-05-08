import { contract, Preconditions } from '@kingjs/function-contract'
import {
  DefaultConstructible,
  PushBackContainer,
} from '@kingjs/cursor-checks'

export const materialize = contract([
  null, // first,
  null, // last,
  [
    DefaultConstructible,
    PushBackContainer,
  ] // Type
], [ null, null, null ],
function materialize(first, last, Type) {
  const result = new Type()

  if (first.clone)
    first = first.clone()

  while (!first.equals(last)) {
    result.push(first.value)
    first.step()
  }

  return result
})
