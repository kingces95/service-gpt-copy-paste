import { SequenceContainer } from "./sequence-container.js"
import { ListNode } from "./list-node.js"
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
  throwReadOutOfBounds,
} from '../../throw.js'

export class List extends SequenceContainer {
  static [Preconditions] = class extends SequenceContainer[Preconditions] {
    setValue$(link, value) {
      if (this.isEnd$(link)) throwWriteOutOfBounds()
      if (this.isBeforeBegin$(link)) throwWriteOutOfBounds()
    }
    value$(link) {
      if (this.isEnd$(link)) throwReadOutOfBounds()
      if (this.isBeforeBegin$(link)) throwReadOutOfBounds()
    }
    step$(link) {
      if (this.isEnd$(link)) throwMoveOutOfBounds()
    }

    insertAfter(cursor, value) {
      if (!this.equatableTo$(cursor)) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    }
    removeAfter(cursor) {
      if (!this.equatableTo$(cursor)) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    }
  }
  
  #root
  #end

  constructor() { 
    super()
    this.#root = new ListNode()
    this.#end = this.#root.insertAfter() 
  }

  isEnd$(link) { return link == this.#end }
  isBeforeBegin$(link) { return link == this.#root }
  
  __isActive$(link) { return !!link.next }

  // basic cursor
  equals$(link, otherLink) { return link == otherLink.token$ }

  // step cursor
  step$(link) { return link.next }

  // input cursor
  value$(link) { return link.value }

  // output cursor
  setValue$(link, value) { link.value = value }

  // cursor factory
  get isEmpty() { return this.#end == this.#root.next }
  beforeBegin(recyclable) { return this.cursor$(recyclable, this.#root) }
  begin(recyclable) { return this.cursor$(recyclable, this.#root.next) }
  end(recyclable) { return this.cursor$(recyclable, this.#end) }

  // container
  dispose$() { 
    this.#root = null 
    this.#end = null
  }

  // sequence container
  get front() { return this.#root.next.value }
  unshift(value) { this.insertAfter(this.beforeBegin(), value) }
  shift() { return this.removeAfter(this.beforeBegin()) }

  // list
  insertAfter(cursor, value) { cursor.token$.insertAfter(value) }
  removeAfter(cursor) { return cursor.token$.removeAfter() }
}
