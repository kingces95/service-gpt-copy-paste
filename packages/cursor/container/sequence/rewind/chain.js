import { RewindContainer } from "./rewind-container.js"
import { ChainNode } from "./chain-node.js"
import {
  throwUnequatable,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
} from '../../../throw.js'

export class Chain extends RewindContainer {
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

  #isEnd(link) { return link == this.#end }
  #isBeforeBegin(link) { return link == this.#root }
  
  // cursor implementation
  __isActive$$(version, link) { return !!link.next }
  value$$(link) { return link.value }
  setAt$$(link, value) { 
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

  get isEmpty$() { return this.#end == this.#root.next }
  get front$() { return this.#root.next.value }
  get back$() { return this.#root.previous.previous.value }

  insertAfter$(cursor, value) {
    if (this.#isEnd(cursor)) this.throwUpdateOutOfBounds$()
    cursor.token$.insertAfter(value)
    this.#count++
    this.__check()
  }
  removeAfter$(cursor) {
    if (this.#isEnd(cursor)) this.throwUpdateOutOfBounds$()
    const result = cursor.token$.removeAfter()
    this.#count--
    this.__check()
    return result
  }
  insertBefore$(cursor, value) {
    if (this.#isBeforeBegin(cursor)) this.throwUpdateOutOfBounds$()
    cursor = cursor.clone()
    cursor.stepBack()
    return this.insertAfter$(cursor, value)
  }
  remove$(cursor) {
    if (this.#isEnd(cursor)) this.throwUpdateOutOfBounds$()
    if (this.#isBeforeBegin(cursor)) this.throwUpdateOutOfBounds$()
    cursor = cursor.clone()
    cursor.stepBack()
    return this.removeAfter$(cursor)
  }
  dispose$() { 
    this.#root = null 
    this.#end = null
  }

  hasBeforeBegin$() { return true }
  beforeBegin$(recyclable) { return this.cursor$(recyclable, this.#root) }
  begin$(recyclable) { return this.cursor$(recyclable, this.#root.next) }
  end$(recyclable) { return this.cursor$(recyclable, this.#end) }

  push$(value) { this.insertBefore$(this.end(), value) }
  pop$() { 
    const cursor = this.end()
    cursor.stepBack()
    return this.remove$(cursor) 
  }
  unshift$(value) { this.insertAfter$(this.beforeBegin(), value) }
  shift$() { return this.removeAfter$(this.beforeBegin()) }

  insertAfter(cursor, value) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) throwUnequatable()
    return this.insertAfter$(cursor, value)
  }
  removeAfter(cursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) throwUnequatable()
    return this.removeAfter$(cursor)
  }
  
  insertBefore(cursor, value) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) throwUnequatable()
    return this.insertBefore$(cursor, value)
  }
  remove(cursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) throwUnequatable()
    return this.remove$(cursor)
  }
}
