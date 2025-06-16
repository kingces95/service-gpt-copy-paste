export function distance(begin, end) {
  let count = 0
  begin = begin.clone()
  while (!begin.equals(end)) {
    if (!begin.step()) throw new Error(
      "Cannot calculate distance: cursors are not aligned.")
    count++
  }
  return count
}