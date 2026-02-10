import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/partial-proxy'
import { CursorFactoryConcept } from '@kingjs/cursor'
import {
  throwStale,
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
  EpilogContainerConcept,
  SequenceContainerConcept,
  RewindContainerConcept,
  SequenceContainerConcept$,
  RewindContainerConcept$,
} from "../../container-concepts.js"

export class Chain extends RewindContainer {
  static [Preconditions] = {
    setValue$(link, value) {
      if (!this.__isActive$(link)) throwStale()
      if (this.__isEnd$(link)) throwWriteOutOfBounds()
      if (this.__isBeforeBegin$(link)) throwWriteOutOfBounds()
    },
    value$(link) {
      if (!this.__isActive$(link)) throwStale()
      if (this.__isEnd$(link)) throwReadOutOfBounds()
      if (this.__isBeforeBegin$(link)) throwReadOutOfBounds()
    },
    step$(link) {
      if (!this.__isActive$(link)) throwStale()
      if (this.__isEnd$(link)) throwMoveOutOfBounds()
    },
    stepBack$(link) {
      if (!this.__isActive$(link)) throwStale()
      if (this.__isBeforeBegin$(link)) throwMoveOutOfBounds()
    },

    insertAfter(cursor, value) {
      if (cursor.container$ != this) throwNotEquatableTo()
      if (this.__isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    },
    removeAfter(cursor) {
      if (cursor.container$ != this) throwNotEquatableTo()
      if (this.__isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    },
    insert(cursor, value) {
      if (cursor.container$ != this) throwNotEquatableTo()
      if (this.__isBeforeBegin$(cursor.token$)) throwUpdateOutOfBounds()
    },
    remove(cursor) {
      if (cursor.container$ != this) throwNotEquatableTo()
      if (this.__isEnd$(cursor.token$)) throwUpdateOutOfBounds()
      if (this.__isBeforeBegin$(cursor.token$)) throwUpdateOutOfBounds()
    },
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

  __isActive$(link) { return !!link.next }
  __isEnd$(link) { return link == this._end }
  __isBeforeBegin$(link) { return link == this._root }

  dispose$() { 
    this._root = null 
    this._end = null
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
  }

  static {
    implement(this, CursorFactoryConcept, {
      get isEmpty() { return this._end == this._root.next },
      begin() { return new this.cursorType(this, this._root.next) },
      end() { return new this.cursorType(this, this._end) },
    })

    implement(this, SequenceContainerConcept, {
      get front() { return this._root.next.value },
      unshift(value) { this.insertAfter(this.beforeBegin(), value) },
      shift() { return this.removeAfter(this.beforeBegin()) },
    })

    implement(this, PrologContainerConcept, {
      beforeBegin() { return new this.cursorType(this, this._root) },
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

    implement(this, RewindContainerConcept, {
      get count() { return this._count },
      get back() { return this._root.previous.previous.value },
      push(value) { this.insert(this.end(), value) },
      pop() { 
        const cursor = this.end()
        cursor.stepBack()
        return this.remove(cursor) 
      },
    })

    implement(this, EpilogContainerConcept, {
       insert(cursor, value) {
        cursor.token$.insert(value)
        this._count++
        this.__check()
      },
      remove(cursor) {
        const result = cursor.token$.remove()
        this._count--
        this.__check()
        return result
      },
    })
  }
}
