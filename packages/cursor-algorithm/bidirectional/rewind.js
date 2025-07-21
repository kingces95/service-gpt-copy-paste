import { BidirectionalCursorConcept } from "@kingjs/cursor"

export function rewind(current, count) {
  if (!(current instanceof BidirectionalCursorConcept)) throw new Error(
    "Cannot rewind: cursor is not a BidirectionalCursor.")

  for (let i = 0; i < count; i++) {
    if (!current.stepBack()) throw new Error(
      "Cannot step back: cursor is at the beginning.")
  }

  return current
}

