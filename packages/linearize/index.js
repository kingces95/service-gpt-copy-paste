export function *linearize(rootOrRoots, adjacent, { 
  preOrder = false,
  reverse = false,
} = { }) {
  const roots = Array.isArray(rootOrRoots)
    ? [ ...rootOrRoots ]
    : [ rootOrRoots ]
  const visited = new Set()

  if (reverse)
    roots.reverse()

  function *walk$(node) {
    if (visited.has(node)) return
    visited.add(node)

    if (preOrder)
      yield node
    
    const adjacentNodes = [...adjacent(node)]
    if (reverse)
      adjacentNodes.reverse()

    for (const adjacentNode of adjacentNodes)
      yield *walk$(adjacentNode)

    if (!preOrder)
      yield node
  }

  for (const root of roots)
    yield* walk$(root)
}
