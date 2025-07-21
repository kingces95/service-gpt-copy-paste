import { BidirectionalCursorConcept } from "@kingjs/cursor"

export function copyBackward(first, last, result) {
  if (!(last instanceof BidirectionalCursorConcept)) throw new Error(
    "Cannot copyBackward: last is not a BidirectionalCursor.")
  if (!(result instanceof BidirectionalCursorConcept)) throw new Error(
    "Cannot copyBackward: result is not a BidirectionalCursor.")

  while (!last.equals(first)) {
    last.stepBack()
    result.stepBack()
    result.value = last.value
  }
  return result
}
