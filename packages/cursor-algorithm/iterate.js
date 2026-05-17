export function *iterate(range) {
  const current = range.begin()
  const end = range.end()

  while (!current.equals(end)) {
    const value = current.value
    current.step()
    yield value
  }
}

