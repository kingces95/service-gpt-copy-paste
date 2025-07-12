import { IndexableContainer } from "./indexable-container.js"

export class Vector extends IndexableContainer {
  #array

  constructor() { 
    super()
    this.#array = []
  }

  // indexable cursor implementation
  at$$$(index) { return this.#array[index] }
  setAt$$$(index, value) { this.#array[index] = value }

  // container implementation
  get count$() { return this.#array.length }

  push$(value) { this.#array.push(value) }
  pop$() { return this.#array.pop() }
  unshift$(value) { this.#array.unshift(value) }
  shift$() { return this.#array.shift() }
  dispose$() { this.#array.length = 0 }
}
