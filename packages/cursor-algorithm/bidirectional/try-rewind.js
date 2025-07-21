import { BidirectionalCursorConcept } from "@kingjs/cursor"
import { advance } from "../advance.js"

export function tryRewind(current, count) {
  if (!(current instanceof BidirectionalCursorConcept)) throw new Error(
    "Cannot try rewind: cursor is not a BidirectionalCursor.")

  let steps = 0
  while (steps < count) {
    if (!current.stepBack()) {
      // if we cannot step back, advance to the initial position
      advance(current, steps)
      return false
    }
    steps++
  }

  return true
}
