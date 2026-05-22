import { BidirectionalCursorShape } from "@kingjs/cursor-shape"

export function copyBackward(target, first, last) {
  if (!(last instanceof BidirectionalCursorShape)) throw new Error(
    "Cannot copyBackward: last is not a BidirectionalCursor.")
  if (!(target instanceof BidirectionalCursorShape)) throw new Error(
    "Cannot copyBackward: result is not a BidirectionalCursor.")

  while (!last.equals(first)) {
    last.stepBack()
    target.stepBack()
    target.value = last.value
  }
  return target
}
