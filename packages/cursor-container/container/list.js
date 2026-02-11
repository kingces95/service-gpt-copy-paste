import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/partial-proxy'
import { CursorFactoryConcept } from '@kingjs/cursor'
import { extend } from '@kingjs/partial-extend'
import {
  throwStale,
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import { ListNode } from "./list-node.js"
import { SequenceContainer } from "../helpers/sequence-container.js"
import {
  PrologContainerConcept,
  SequenceContainerConcept,
} from "../container-concepts.js"

export class List extends SequenceContainer {
  static [Preconditions] = {
    setValue$({ token$: link }, value) {
      if (!this.__isActive$(link)) throwStale()
      if (this.__isEnd$(link)) throwWriteOutOfBounds()
      if (this.__isBeforeBegin$(link)) throwWriteOutOfBounds()
    },
    value$({ token$: link }) {
      if (!this.__isActive$(link)) throwStale()
      if (this.__isEnd$(link)) throwReadOutOfBounds()
      if (this.__isBeforeBegin$(link)) throwReadOutOfBounds()
    },
    step$({ token$: link }) {
      if (!this.__isActive$(link)) throwStale()
      if (this.__isEnd$(link)) throwMoveOutOfBounds()
    }, 
  
    insertAfter(cursor, value) {
      if (cursor.container$ != this) throwNotEquatableTo()
      if (this.__isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    },
    removeAfter(cursor) {
      if (cursor.container$ != this) throwNotEquatableTo()
      if (this.__isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    }
  }
  
  _root
  _end

  constructor() { 
    super()
    this._root = new ListNode()
    this._end = this._root.insertAfter() 
  }

  __isActive$(link) { return !!link.next }
  __isEnd$(link) { return link == this._end }
  __isBeforeBegin$(link) { return link == this._root }
  
  dispose$() { 
    this._root = null 
    this._end = null
  }

  static {
    implement(this, SequenceContainer.cursorType.api$, {
      equals$({ token$: link }, { token$: otherLink }) { 
        return link == otherLink },
      step$({ token$: link }) { return link.next },
      value$({ token$: link }) { return link.value },
      setValue$({ token$: link }, value) { link.value = value },
    })
  }

  static {
    extend(this, {
      beginToken$() { return this._root.next },
      endToken$() { return this._end },
    })

    implement(this, CursorFactoryConcept, {
      get isEmpty() { return this._end == this._root.next },
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
}
