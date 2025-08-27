import Denque from "denque"
import { implement } from '@kingjs/partial-class'
import {
  throwNotSupported,
} from '@kingjs/cursor'
import { 
  IndexableContainer 
} from "./indexable-container.js"
import {
  IndexableContainerConcept,
} from "../../../container-concepts.js"

export class Deque extends IndexableContainer {
  static {
    implement(this, IndexableContainerConcept)
  }
  
  #denque

  constructor() { 
    super()
    this.#denque = new Denque()
  }
  
  // indexable cursor
  at$(index) { return this.#denque.get(index) }
  setAt$(index, offset, value) { throwNotSupported() }

  // container
  dispose$() { this.#denque.clear() }
  
  // sequence container
  unshift(value) { this.#denque.unshift(value) }
  shift() { return this.#denque.shift() }

  // rewind container
  get count() { return this.#denque.length }
  push(value) { this.#denque.push(value) }
  pop() { return this.#denque.pop() }
}
