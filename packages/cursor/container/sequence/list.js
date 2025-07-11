import { SequenceContainer } from "./sequence-container.js"
import { ListNode } from "./list-node.js"

export class List extends SequenceContainer {
  #root
  #end

  constructor() { 
    super()
    this.#root = new ListNode()
    this.#end = this.#root.insertAfter() 
  }

  // cursor implementation
  __isActive$$(version, link) { return !!link.next }
  isEnd$$(link) { return link == this.#end }
  isBegin$$(link) { return link == this.#root.next }
  isBeforeBegin$$(link) { return link == this.#root }
  value$$(link) { return link.value }
  setAt$$(link, value) { link.value = value }
  step$$(link) { return link.next }
  equals$$(link, otherLink) { return link == otherLink.token$ }

  get isEmpty$() { return this.#end == this.#root.next }
  get front$() { return this.#root.next.value }

  begin$(recyclable) { return this.cursor$(recyclable, this.#root.next) }
  end$(recyclable) { return this.cursor$(recyclable, this.#end) }
  dispose$() { 
    this.#root = null 
    this.#end = null
  }

  beforeBegin(recyclable) { return this.cursor$(recyclable, this.#root) }
  insertAfter(cursor, value) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) this.throwUnequatable$()
    if (this.isEnd$(cursor)) this.throwWriteOutOfBounds$()
    cursor.token$.insertAfter(value)
  }
  removeAfter(cursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) this.throwUnequatable$()
    if (this.isEnd$(cursor)) this.throwWriteOutOfBounds$()
    return cursor.token$.removeAfter()
  }
  unshift(value) {
    this.insertAfter(this.beforeBegin(), value)
  }
  shift() {
    return this.removeAfter(this.beforeBegin())
  }
}
