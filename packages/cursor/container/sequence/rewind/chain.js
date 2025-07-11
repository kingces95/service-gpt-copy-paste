import { RewindContainer } from "./rewind-container.js"
import { ChainNode } from "./chain-node.js"

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
    //   current = current.previous$
    // if (current != this.#root) throw new Error(
    //   'Chain is not properly linked in reverse')
  }

  // cursor implementation
  __isActive$$(version, link) { return !!link.next }
  isEnd$$(link) { return link == this.#end }
  isBegin$$(link) { return link == this.#root.next }
  isBeforeBegin$$(link) { return link == this.#root }
  value$$(link) { return link.value }
  setAt$$(link, value) { link.value = value }
  step$$(link) { return link.next }
  stepBack$$(link) { return link.previous$ }
  equals$$(link, otherLink) { return link == otherLink.token$ }

  get isEmpty$() { return this.#end == this.#root.next }
  get front$() { return this.#root.next.value }
  get back$() { return this.#root.previous$.previous$.value }

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

  insertAfter$(cursor, value) {
    cursor.token$.insertAfter(value)
    this.#count++
    this.__check()
  }
  removeAfter$(cursor) {
    const result = cursor.token$.removeAfter()
    this.#count--
    this.__check()
    return result
  }
  insertBefore$(cursor, value) {
    cursor.stepBack()
    return this.insertAfter$(cursor, value)
  }
  remove$(cursor) {
    cursor.stepBack()
    return this.removeAfter$(cursor)
  }
  dispose$() { 
    this.#root = null 
    this.#end = null
  }

  beforeBegin(recyclable) { return this.cursor$(recyclable, this.#root) }

  insertAfter(cursor, value) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) this.throwUnequatable$()
    if (this.isEnd$(cursor)) this.throwWriteOutOfBounds$()
    return this.insertAfter$(cursor, value)
  }
  removeAfter(cursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) this.throwUnequatable$()
    if (this.isEnd$(cursor)) this.throwWriteOutOfBounds$()
    return this.removeAfter$(cursor)
  }
  
  insertBefore(cursor, value) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) this.throwUnequatable$()
    if (this.isBeforeBegin$(cursor)) this.throwWriteOutOfBounds$()
    if (this.isBegin$(cursor)) return this.unshift(value)
    return this.insertBefore$(cursor.clone(), value)
  }
  remove(cursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(cursor)) this.throwUnequatable$()
    if (this.isEnd$(cursor)) this.throwWriteOutOfBounds$()
    if (this.isBeforeBegin$(cursor)) this.throwWriteOutOfBounds$()
    return this.remove$(cursor.clone())
  }
}
