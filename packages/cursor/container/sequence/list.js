import { SequenceContainer } from "./sequence-container.js"
import { ListNode } from "./list-node.js"
import {
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
} from '../../throw.js'

export class List extends SequenceContainer {
  #root
  #end

  constructor() { 
    super()
    this.#root = new ListNode()
    this.#end = this.#root.insertAfter() 
  }

  #isEnd(link) { return link == this.#end }

  // cursor implementation
  __isActive$$(link) { return !!link.next }
  value$$(link) { return link.value }
  setValue$$(link, value) { 
    if (this.#isEnd(link)) throwWriteOutOfBounds()
    link.value = value 
  }
  step$$(link) { 
    if (this.#isEnd(link)) throwMoveOutOfBounds()
    return link.next 
  }
  equals$$(link, otherLink) { return link == otherLink.token$ }

  get isEmpty$() { return this.#end == this.#root.next }
  get front$() { return this.#root.next.value }

  beforeBegin$(recyclable) { return this.cursor$(recyclable, this.#root) }
  begin$(recyclable) { return this.cursor$(recyclable, this.#root.next) }
  end$(recyclable) { return this.cursor$(recyclable, this.#end) }
  dispose$() { 
    this.#root = null 
    this.#end = null
  }

  insertAfter(cursor, value) {
    if (!this.equatableTo$(cursor)) throwNotEquatableTo()
    if (this.#isEnd(cursor.token$)) throwUpdateOutOfBounds()
    cursor.token$.insertAfter(value)
  }
  removeAfter(cursor) {
    if (!this.equatableTo$(cursor)) throwNotEquatableTo()
    if (this.#isEnd(cursor.token$)) throwUpdateOutOfBounds()
    return cursor.token$.removeAfter()
  }
  unshift(value) {
    this.insertAfter(this.beforeBegin(), value)
  }
  shift() {
    return this.removeAfter(this.beforeBegin())
  }
}
