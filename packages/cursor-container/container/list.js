import { implement } from '@kingjs/implement'
import { CursorFactoryConcept } from '@kingjs/cursor'
import { extend } from '@kingjs/partial-extend'
import { ListNode } from "./list-node.js"
import { SequenceContainer } from "../helpers/sequence-container.js"
import {
  PrologContainerConcept,
  SequenceContainerConcept,
} from "../container-concepts.js"

export class List extends SequenceContainer {
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
    implement(this, SequenceContainer.cursorType.api$.linked$, {
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
