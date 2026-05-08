import { BidirectionalCursorConcept } from "@kingjs/cursor"

export function copyBackward(target, first, last) {
  if (!(last instanceof BidirectionalCursorConcept)) throw new Error(
    "Cannot copyBackward: last is not a BidirectionalCursor.")
  if (!(target instanceof BidirectionalCursorConcept)) throw new Error(
    "Cannot copyBackward: result is not a BidirectionalCursor.")

  while (!last.equals(first)) {
    last.stepBack()
    target.stepBack()
    target.value = last.value
  }
  return target
}
