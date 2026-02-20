
export class ForwardLink {
  static __id = 0

  #value
  #next
  #__id = ForwardLink.__id++

  constructor(value) {
    this.#value = value
    this.#next = this
  }

  setNext$(node) { this.#next = node }

  get value() { return this.#value }
  set value(value) { this.#value = value }
  get next() { return this.#next }

  insertAfter(value) {
    const { constructor: ctor } = this
    const node = new ctor(value)
    node.setNext$(this.next)
    this.setNext$(node)
    return node
  }
  removeAfter() {
    const node = this.next
    this.setNext$(node.next)
    node.setNext$(null)
    return node.value
  }
}
