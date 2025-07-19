import { IndexableContainer } from "./indexable-container.js"

export class Vector extends IndexableContainer {
  __array

  constructor() { 
    super()
    this.__array = []
  }

  // indexable cursor implementation
  at$$$(index) { return this.__array[index] }
  setAt$$$(index, value) { this.__array[index] = value }

  // container implementation
  get count$() { return this.__array.length }

  push$(value) { this.__array.push(value) }
  pop$() { return this.__array.pop() }
  unshift$(value) { this.__array.unshift(value) }
  shift$() { return this.__array.shift() }
  dispose$() { this.__array.length = 0 }
}
