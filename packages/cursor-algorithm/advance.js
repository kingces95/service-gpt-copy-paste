export function advance(current, count) {
  if (count < 0) 
    throw new Error("Cannot advance: count must be non-negative.")

  for (let i = 0; i < count; i++)
    current.step()

  return current
}

