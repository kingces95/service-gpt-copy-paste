import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/debug-proxy'
import { implement } from '@kingjs/implement'
import {
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import { RewindContainer } from "./rewind-container.js"
import { ChainNode } from "./chain-node.js"
import { 
  PrologContainerConcept,
  SequenceContainerConcept,
  RewindContainerConcept,
  SequenceContainerConcept$,
  RewindContainerConcept$,
} from "../../container-concepts.js"

export class Chain extends RewindContainer {
  static [Preconditions] = class extends RewindContainer[Preconditions] {
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
    stepBack$(link) {
      if (this.isBeforeBegin$(link)) throwMoveOutOfBounds()
    }

    insertAfter(cursor, value) {
      if (cursor.scope$ != this) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    }
    removeAfter(cursor) {
      if (cursor.scope$ != this) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    }
    insert(cursor, value) {
      if (cursor.scope$ != this) throwNotEquatableTo()
      if (this.isBeforeBegin$(cursor.token$)) throwUpdateOutOfBounds()
    }
    remove(cursor) {
      if (cursor.scope$ != this) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
      if (this.isBeforeBegin$(cursor.token$)) throwUpdateOutOfBounds()
    }
  }

  _count
  _root
  _end

  constructor() { 
    super()
    this._root = new ChainNode()
    this._end = this._root.insertAfter() 
    this._count = 0
    this.__check()
  }

  static {
    implement(this, SequenceContainerConcept$, {
      equals$(link, otherLink) { return link == otherLink.token$ },
      step$(link) { return link.next },
      value$(link) { return link.value },
      setValue$(link, value) { link.value = value },
    })
    
    implement(this, RewindContainerConcept$, {
      stepBack$(link) { return link.previous }
    })

    implement(this, PrologContainerConcept, {
      beforeBegin() { return this.cursor$(this._root) },
      insertAfter(cursor, value) {
        cursor.token$.insertAfter(value)
        this._count++
        this.__check()
      },
      removeAfter(cursor) {
        const result = cursor.token$.removeAfter()
        this._count--
        this.__check()
        return result
      },
    })

    implement(this, SequenceContainerConcept, {
      get front() { return this._root.next.value },
      unshift(value) { this.insertAfter(this.beforeBegin(), value) },
      shift() { return this.removeAfter(this.beforeBegin()) },
    })

    implement(this, RewindContainerConcept, {
      get back() { return this._root.previous.previous.value },
      push(value) { this.insert(this.end(), value) },
      pop() { 
        const cursor = this.end()
        cursor.stepBack()
        return this.remove(cursor) 
      },
    })
  }

  __check() {
    // the chain should form a loop of count + 2 nodes (root and end)
    // let count = this.#count + 2

    // let current = this.#root
    // for (let i = 0; i < count; i++)
    //   current = current.next
    // if (current != this.#root) throw new Error(
    //   'Chain is not properly linked')

    // current = this.#root
    // for (let i = 0; i < count; i++)
    //   current = current.previous
    // if (current != this.#root) throw new Error(
    //   'Chain is not properly linked in reverse')
  }

  isEnd$(link) { return link == this._end }
  isBeforeBegin$(link) { return link == this._root }
  
  __isActive$(link) { return !!link.next }

  // cursor factory
  get isEmpty() { return this._end == this._root.next }
  begin() { return this.cursor$(this._root.next) }
  end() { return this.cursor$(this._end) }

  // container
  dispose$() { 
    this._root = null 
    this._end = null
  }

  // chain container
  insert(cursor, value) {
    cursor.token$.insert(value)
    this._count++
    this.__check()
  }
  remove(cursor) {
    const result = cursor.token$.remove()
    this._count--
    this.__check()
    return result
  }
}
