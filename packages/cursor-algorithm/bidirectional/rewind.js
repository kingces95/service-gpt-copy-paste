import { BidirectionalCursorConcept } from "@kingjs/cursor"

export function rewind(current, count) {
  if (!(current instanceof BidirectionalCursorConcept)) throw new Error(
    "Cannot rewind: cursor is not a BidirectionalCursor.")

  for (let i = 0; i < count; i++)
    current.stepBack()

  return current
}

