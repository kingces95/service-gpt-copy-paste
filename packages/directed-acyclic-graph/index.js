export class DirectedAcyclicGraph {
  
  #roots
  #childrenFn

  constructor(rootOrRoots, childrenFn) {
    this.#roots = rootOrRoots[Symbol.iterator] ? rootOrRoots : [ rootOrRoots ]
    this.#childrenFn = childrenFn
  }

  *#linearExtension(node, visited) {
    if (visited.has(node)) return
    visited.add(node)
    for (const child of this.#childrenFn(node))
      yield* this.#linearExtension(child, visited)
    yield node
  }

  transpose() {
    const nodes = new Map()
    for (const node of this)
      nodes.set(node, [])
    for (const [node] of nodes.entries())
      for (const child of this.#childrenFn(node))
        nodes.get(child).push(node)
    return new DirectedAcyclicGraph(nodes.keys(), node => nodes.get(node))
  }

  *[Symbol.iterator]() {
    const visited = new Set()
    for (const root of this.#roots)
      yield* this.#linearExtension(root, visited)
  }
}
