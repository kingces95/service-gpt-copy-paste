import { BidirectionalCursor } from "../../cursor/bidirectional-cursor.js"
import { rewindUntil } from "./rewind-until.js"

export function stepBackUntil(current, predicate) {
  if (!(current instanceof BidirectionalCursor)) throw new Error(
    "Cannot step back until: cursor is not a BidirectionalCursor.")

  if (!current.stepBack()) return false

  return rewindUntil(current, predicate)
}
