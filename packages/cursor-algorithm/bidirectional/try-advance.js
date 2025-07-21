import { BidirectionalCursorConcept } from "@kingjs/cursor"
import { rewind } from "./rewind.js"

// advance the cursor by count steps, but only if it is possible to do so
// without stepping past the end of the container. Internally, the cursor
// will be advanced by count steps. If the end of the container is reached 
// before count steps, then the cursor will be rewound to the initial position.
export function tryAdvance(current, count) {
  if (!(current instanceof BidirectionalCursorConcept)) throw new Error(
    "Cannot try advance: cursor is not a BidirectionalCursor.")

  let steps = 0
  while (steps < count) {
    if (!current.step()) {
      // if we cannot step, rewind to the initial position
      rewind(current, steps)
      return false
    }
    steps++
  }

  return true
}
