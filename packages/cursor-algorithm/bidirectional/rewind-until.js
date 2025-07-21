import { BidirectionalCursorConcept } from "@kingjs/cursor"

// rewind the cursor until the predicate returns true, or until the beginning
// of the container is reached. If the predicate is not satisfied, the cursor
// will have been rewound to the beginning of the container. Returns true if 
// the predicate was satisfied, false otherwise. If the cursor already
// satisfies the predicate, then it will not be modified.
export function rewindUntil(current, predicate) {
  if (!(current instanceof BidirectionalCursorConcept)) throw new Error(
    "Cannot rewind until: cursor is not a BidirectionalCursor.")

  if (typeof predicate !== 'function') throw new Error(
    "Cannot rewind until: predicate is not a function.")

  do {
    if (predicate(current.value)) return true
    current.stepBack()
  } while (!current.isBegin)

  return false
}
