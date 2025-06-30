import Denque from "denque"
import { SequenceContainer } from "./sequence-container.js"

export class Deque extends SequenceContainer {
  #denque

  constructor() { 
    super()
    this.#denque = new Denque()
  }

  get count() {
    this.__throwIfDisposed$()
    return this.#denque.length
  }

  set(value, index) {
    this.__throwIfDisposed$()
    if (index < 0) throw new RangeError(
      `Index cannot be negative: ${index}`)
    if (index >= this.#denque.length) throw new RangeError(
      `Index out of bounds: ${index} >= ${this.#denque.length}`)
    this.#denque.set(index, value)
  }
  at(index) {
    this.__throwIfDisposed$()
    return this.#denque.get(index)
  }
  push(value) {
    this.__throwIfDisposed$()
    this.#denque.push(value)
  }
  unshift(value) { 
    this.__throwIfDisposed$()
    this.#denque.unshift(value)
  }
  pop(cursor) {
    this.__throwIfDisposed$()
    const count = this.end().subtract(cursor)
    this.__bumpVersion$()
    const result = []
    for (let i = 0; i < count; i++)
      result.push(this.#denque.pop())
    return result
  }
  shift(cursor) {
    this.__throwIfDisposed$()
    const count = cursor.subtract(this.begin())
    this.__bumpVersion$()
    const result = []
    for (let i = 0; i < count; i++)
      result.push(this.#denque.shift())
    return result
  }
  dispose() {
    const result = this.shift(this.end())
    super.dispose()
    this.#denque.clear()
    this.#denque = null
    return result
  }
}
