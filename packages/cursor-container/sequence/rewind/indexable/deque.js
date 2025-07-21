import Denque from "denque"
import { IndexableContainer } from "./indexable-container.js"
import {
  throwNotSupported,
} from '@kingjs/cursor'

export class Deque extends IndexableContainer {
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

  // container implementation
  get count() { return this.#denque.length }
  push(value) { this.#denque.push(value) }
  pop() { return this.#denque.pop() }
}
