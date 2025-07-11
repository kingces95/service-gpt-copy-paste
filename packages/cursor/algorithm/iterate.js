export function *iterate(current, end) {
  while (!current.equals(end)) {
    const value = current.next()
    yield value
  }
}

