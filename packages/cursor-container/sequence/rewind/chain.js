import { RewindContainer } from "./rewind-container.js"
import { ChainNode } from "./chain-node.js"
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'

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
      if (!this.equatableTo$(cursor)) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    }
    removeAfter(cursor) {
      if (!this.equatableTo$(cursor)) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
    }
    insertBefore(cursor, value) {
      if (!this.equatableTo$(cursor)) throwNotEquatableTo()
      if (this.isBeforeBegin$(cursor.token$)) throwUpdateOutOfBounds()
    }
    remove(cursor) {
      if (!this.equatableTo$(cursor)) throwNotEquatableTo()
      if (this.isEnd$(cursor.token$)) throwUpdateOutOfBounds()
      if (this.isBeforeBegin$(cursor.token$)) throwUpdateOutOfBounds()
    }
  }

  #count
  #root
  #end

  constructor() { 
    super()
    this.#root = new ChainNode()
    this.#end = this.#root.insertAfter() 
    this.#count = 0
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

  // rewind cursor
  stepBack$(link) { return link.previous }

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

  // rewind container
  get back() { return this.#root.previous.previous.value }
  push(value) { this.insertBefore(this.end(), value) }
  pop() { 
    const cursor = this.end()
    cursor.stepBack()
    return this.remove(cursor) 
  }

  // chain
  insertAfter(cursor, value) {
    cursor.token$.insertAfter(value)
    this.#count++
    this.__check()
  }
  removeAfter(cursor) {
    const result = cursor.token$.removeAfter()
    this.#count--
    this.__check()
    return result
  }

  insertBefore(cursor, value) {
    cursor = cursor.clone()
    cursor.stepBack()
    return this.insertAfter(cursor, value)
  }
  remove(cursor) {
    cursor = cursor.clone()
    cursor.stepBack()
    return this.removeAfter(cursor)
  }}
