export function advance(current, count) {
  if (count < 0) 
    throw new Error("Cannot advance: count must be non-negative.")

  for (let i = 0; i < count; i++) {
    if (!current.step()) throw new Error(
      "Cannot step: cursor is at the end.")
  }

  return current
}

