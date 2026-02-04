import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwStale,
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import { ListNode } from "./list-node.js"
import { SequenceContainer } from "./sequence-container.js"
import { 
  PrologContainerConcept,
  SequenceContainerConcept,
  SequenceContainerConcept$,
} from "../container-concepts.js"

export class List extends SequenceContainer {
  static [Preconditions] = class extends SequenceContainer[Preconditions] {
    setValue$(link, value) {
      if (!this.__isActive$(link)) throwStale()
      if (this.isEnd$(link)) throwWriteOutOfBounds()
      if (this.isBeforeBegin$(link)) throwWriteOutOfBounds()
    }
    value$(link) {
      if (!this.__isActive$(link)) throwStale()
      if (this.isEnd$(link)) throwReadOutOfBounds()
      if (this.isBeforeBegin$(link)) throwReadOutOfBounds()
    }
    step$(link) {
      if (!this.__isActive$(link)) throwStale()
      if (this.isEnd$(link)) throwMoveOutOfBounds()
    }

    insertAfter(cursor, value) {
      if (cursor.container$ != this) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    }
    removeAfter(cursor) {
      if (cursor.container$ != this) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    }
  }
  
  _root
  _end

  constructor() { 
    super()
    this._root = new ListNode()
    this._end = this._root.insertAfter() 
  }

  static {
    implement(this, SequenceContainerConcept$, {
      equals$(link, otherLink) { return link == otherLink.token$ },
      step$(link) { return link.next },
      value$(link) { return link.value },
      setValue$(link, value) { link.value = value },
    })

    implement(this, PrologContainerConcept, {
      beforeBegin() { return new this.cursorType(this, this._root) },
      insertAfter(cursor, value) { cursor.token$.insertAfter(value) },
      removeAfter(cursor) { return cursor.token$.removeAfter() },
    })

    implement(this, SequenceContainerConcept, {
      get front() { return this._root.next.value },
      unshift(value) { this.insertAfter(this.beforeBegin(), value) },
      shift() { return this.removeAfter(this.beforeBegin()) },
    })
  }

  isEnd$(link) { return link == this._end }
  isBeforeBegin$(link) { return link == this._root }
  
  __isActive$(link) { return !!link.next }

  // cursor factory
  get isEmpty() { return this._end == this._root.next }
  begin() { return new this.cursorType(this, this._root.next) }
  end() { return new this.cursorType(this, this._end) }

  // container
  dispose$() { 
    this._root = null 
    this._end = null
  }
}
