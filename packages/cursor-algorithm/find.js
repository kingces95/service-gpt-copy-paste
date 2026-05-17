export function find(range, predicate) {
  const current = range.begin()
  const end = range.end()

  while (!current.equals(end)) {
    if (predicate(current))
      return true
    current.step()
  }
  return false
}
