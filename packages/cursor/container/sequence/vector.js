import { SequenceContainer } from "./sequence-container.js"

export class Vector extends SequenceContainer {
  #array

  constructor() { 
    super()
    this.#array = array
  }

  get count() {
    this.__throwIfDisposed$()
    return this.#array.length
  }

  set(value, index) {
    this.__throwIfDisposed$()
    if (index < 0) throw new RangeError(
      `Index cannot be negative: ${index}`)
    if (index >= this.#array.length) throw new RangeError(
      `Index out of bounds: ${index} >= ${this.#array.length}`)
    this.#array[index] = value
  }
  at(index) {
    this.__throwIfDisposed$()
    return this.#array[index]
  }
  push(value) {
    this.__throwIfDisposed$()
    this.#array.push(value)
  }
  unshift(value) {
    this.__throwIfDisposed$()
    this.#array.unshift(value)
  }
  pop(cursor) {
    this.__throwIfDisposed$()
    const count = this.end(cursor).subtract(cursor)
    this.__bumpVersion$()
    const result = this.#array.slice(-count)
    this.#array.length -= count
    return result
  }
  shift(cursor) {
    this.__throwIfDisposed$()
    const count = cursor.subtract(this.begin())
    this.__bumpVersion$()
    const result = this.#array.slice(0, count)
    this.#array.splice(0, count)
    return result
  }
}
