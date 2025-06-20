import { BidirectionalCursor } from "./cursor.js"

export function distance(begin, end) {
  let count = 0
  begin = begin.clone()
  while (!begin.equals(end)) {
    if (!begin.step()) throw new Error(
      "Cannot calculate distance: failed to find end.")
    count++
  }
  return count
}

export function advance(current, count) {
  if (!(current instanceof BidirectionalCursor)) throw new Error(
    "Cannot advance: cursor is not a BidirectionalCursor.")

  if (count < 0) return rewind(current, -count)

  for (let i = 0; i < count; i++) {
    if (!current.step()) throw new Error(
      "Cannot step: cursor is at the end.")
  }

  return current
}

export function rewind(current, count) {
  if (!(current instanceof BidirectionalCursor)) throw new Error(
    "Cannot rewind: cursor is not a BidirectionalCursor.")

  for (let i = 0; i < count; i++) {
    if (!current.stepBack()) throw new Error(
      "Cannot step back: cursor is at the beginning.")
  }

  return current
}

// rewind the cursor until the predicate returns true, or until the beginning
// of the container is reached. If the predicate is not satisfied, the cursor
// will have been rewound to the beginning of the container. Returns true if 
// the predicate was satisfied, false otherwise. If the cursor already
// satisfies the predicate, then it will not be modified.
export function rewindUntil(current, predicate) {
  if (!(current instanceof BidirectionalCursor)) throw new Error(
    "Cannot rewind until: cursor is not a BidirectionalCursor.")

  if (typeof predicate !== 'function') throw new Error(
    "Cannot rewind until: predicate is not a function.")

  do {
    if (predicate(current.value)) return true
    current.stepBack()
  } while (!current.isBegin)

  return false
}

export function stepBackUntil(current, predicate) {
  if (!(current instanceof BidirectionalCursor)) throw new Error(
    "Cannot step back until: cursor is not a BidirectionalCursor.")

  if (!current.stepBack()) return false
  
  return rewindUntil(current, predicate)
}

// advance the cursor by count steps, but only if it is possible to do so
// without stepping past the end of the container. Internally, the cursor
// will be advanced by count steps. If the end of the container is reached 
// before count steps, then the cursor will be rewound to the initial position.
export function tryAdvance(current, count) {
  if (!(current instanceof BidirectionalCursor)) throw new Error(
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

export function tryRewind(current, count) {
  if (!(current instanceof BidirectionalCursor)) throw new Error(
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