export function distance(begin, end) {
  let count = 0
  while (!begin.equals(end)) {
    if (!begin.step()) throw new Error(
      "Cannot calculate distance: failed to find end.")
    count++
  }
  return count
}
