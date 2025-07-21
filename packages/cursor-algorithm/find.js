export function find(current, end, predicate) {
  while (!current.equals(end)) {
    if (predicate(current))
      return true
    current.step()
  }
  return false
}
