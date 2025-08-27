import { implement } from '@kingjs/partial-class'
import { IndexableContainer } from "./indexable-container.js"
import {
  IndexableContainerConcept
} from "../../../container-concepts.js"

export class Vector extends IndexableContainer {
  static {
    implement(this, IndexableContainerConcept)
  }

  #array

  constructor() { 
    super()
    this.#array = []
  }

  // indexable cursor
  at$(index, offset) { return this.#array[index + offset] }
  setAt$(index, offset, value) { this.#array[index + offset] = value }

  // container
  dispose$() { this.#array.length = 0 }
  
  // sequence container
  shift() { return this.#array.shift() }
  unshift(value) { this.#array.unshift(value) }
  
  // rewind container
  get count() { return this.#array.length }
  push(value) { this.#array.push(value) }
  pop() { return this.#array.pop() }

  // indexable container
  at(index) { return this.#array[index] }
  setAt(index, value) { this.#array[index] = value }
}
