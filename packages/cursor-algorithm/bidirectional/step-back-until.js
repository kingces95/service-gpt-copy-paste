import { BidirectionalCursorShape } from "@kingjs/cursor-shape"
import { rewindUntil } from "./rewind-until.js"

export function stepBackUntil(current, predicate) {
  if (!(current instanceof BidirectionalCursorShape)) throw new Error(
    "Cannot step back until: cursor is not a BidirectionalCursor.")

  current.stepBack()

  return rewindUntil(current, predicate)
}
