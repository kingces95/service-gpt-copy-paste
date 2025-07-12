export class ListNode {
  static __id = 0

  #value
  #next
  #__id = ListNode.__id++

  constructor(value) {
    this.#value = value
    this.#next = this
  }

  get __id$() { return this.#__id }

  activate$(value) { return new ListNode(value) }
  setNext$(node) { this.#next = node }

  get value() { return this.#value }
  set value(value) { this.#value = value }
  get next() { return this.#next }

  insertAfter(value) {
    const node = this.activate$(value)
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
