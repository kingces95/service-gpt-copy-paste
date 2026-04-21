export function *linearize(root, adjacent, { 
  preOrder = false,
  reverse = false,
} = { }) {
  const visited = new Set()

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

  yield* walk$(root)
}