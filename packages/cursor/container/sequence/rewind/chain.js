import { RewindContainer } from "./rewind-container.js"
import { ChainNode } from "./chain-node.js"
import {
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
} from '../../../throw.js'

export class Chain extends RewindContainer {
  __count
  __root
  __end

  constructor() { 
    super()
    this.__root = new ChainNode()
    this.__end = this.__root.insertAfter() 
    this.__count = 0
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

  #isEnd(link) { return link == this.__end }
  #isBeforeBegin(link) { return link == this.__root }
  
  // cursor implementation
  __isActive$$(link) { return !!link.next }
  value$$(link) { return link.value }
  setValue$$(link, value) { 
    if (this.#isEnd(link)) throwWriteOutOfBounds()
    if (this.#isBeforeBegin(link)) throwWriteOutOfBounds()
    link.value = value 
  }
  step$$(link) { 
    if (this.#isEnd(link)) throwMoveOutOfBounds()
    return link.next 
  }
  stepBack$$(link) { 
    if (this.#isBeforeBegin(link)) throwMoveOutOfBounds()
    return link.previous 
  }
  equals$$(link, otherLink) { return link == otherLink.token$ }

  get isEmpty$() { return this.__end == this.__root.next }
  get front$() { return this.__root.next.value }
  get back$() { return this.__root.previous.previous.value }

  insertAfter$(cursor, value) {
    if (this.#isEnd(cursor)) throwUpdateOutOfBounds()
    cursor.token$.insertAfter(value)
    this.__count++
    this.__check()
  }
  removeAfter$(cursor) {
    if (this.#isEnd(cursor)) throwUpdateOutOfBounds()
    const result = cursor.token$.removeAfter()
    this.__count--
    this.__check()
    return result
  }
  insertBefore$(cursor, value) {
    if (this.#isBeforeBegin(cursor)) throwUpdateOutOfBounds()
    cursor = cursor.clone()
    cursor.stepBack()
    return this.insertAfter$(cursor, value)
  }
  remove$(cursor) {
    if (this.#isEnd(cursor)) throwUpdateOutOfBounds()
    if (this.#isBeforeBegin(cursor)) throwUpdateOutOfBounds()
    cursor = cursor.clone()
    cursor.stepBack()
    return this.removeAfter$(cursor)
  }
  dispose$() { 
    this.__root = null 
    this.__end = null
  }

  beforeBegin$(recyclable) { return this.cursor$(recyclable, this.__root) }
  begin$(recyclable) { return this.cursor$(recyclable, this.__root.next) }
  end$(recyclable) { return this.cursor$(recyclable, this.__end) }

  push$(value) { this.insertBefore$(this.end(), value) }
  pop$() { 
    const cursor = this.end()
    cursor.stepBack()
    return this.remove$(cursor) 
  }
  unshift$(value) { this.insertAfter$(this.beforeBegin(), value) }
  shift$() { return this.removeAfter$(this.beforeBegin()) }

  insertAfter(cursor, value) {
    if (!this.equatableTo$(cursor)) throwNotEquatableTo()
    return this.insertAfter$(cursor, value)
  }
  removeAfter(cursor) {
    if (!this.equatableTo$(cursor)) throwNotEquatableTo()
    return this.removeAfter$(cursor)
  }
  
  insertBefore(cursor, value) {
    if (!this.equatableTo$(cursor)) throwNotEquatableTo()
    return this.insertBefore$(cursor, value)
  }
  remove(cursor) {
    if (!this.equatableTo$(cursor)) throwNotEquatableTo()
    return this.remove$(cursor)
  }
}
