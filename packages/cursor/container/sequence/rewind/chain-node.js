import { ListNode } from "../list-node.js"

export class ChainNode extends ListNode {
  #previous

  constructor(value) {
    super(value)
    this.#previous = this
  }

  activate$(value) { return new ChainNode(value) }

  get previous$() { return this.#previous }
  setPrevious$(node) { this.#previous = node }

  insertAfter(value) {
    const node = super.insertAfter(value)
    node.setPrevious$(this)
    node.next.setPrevious$(node)
    return node
  }
  removeAfter() {
    const node = this.next
    const nextNode = node.next
    const result = super.removeAfter()
    node.setPrevious$(null)
    nextNode.setPrevious$(this)
    return result
  }

  insertBefore(value) { return this.previous$.insertAfter(value) }
  remove() { return this.previous$.removeAfter() }
}
