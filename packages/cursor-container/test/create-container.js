export function populateContainer(container, values = []) {
  if (container.insertOrAssign) {
    for (const value of values) {
      container.insertOrAssign(value[0], value[1])
    }
    return container
  }

  if (container.insert && container.contains) {
    for (const value of values)
      container.insert(value)
    return container
  }

  if (container.pushBack) {
    for (const value of values)
      container.pushBack(value)
    return container
  }

  if (container.insertValueAfter) {
    for (const value of [...values].reverse())
      container.insertValueAfter(container.beforeBegin(), value)
    return container
  }

  if (container.insertValue) {
    for (const value of values)
      container.insertValue(container.end(), value)
    return container
  }

  throw new Error('Container has no supported population member.')
}

export function createContainer(Type, values = []) {
  const result = new Type()
  return populateContainer(result, values)
}
