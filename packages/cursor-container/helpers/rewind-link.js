import { ForwardLink } from './forward-link.js'

export class RewindLink extends ForwardLink {
  #previous

  constructor(value) {
    super(value)
    this.#previous = this
  }

  setPrevious$(node) { this.#previous = node }

  get previous() { return this.#previous }

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

  insert(value) { return this.previous.insertAfter(value) }
  remove() { return this.previous.removeAfter() }
}
