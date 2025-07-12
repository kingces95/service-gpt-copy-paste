import Denque from "denque"
import { IndexableContainer } from "./indexable-container.js"

export class Deque extends IndexableContainer {
  #denque

  constructor() { 
    super()
    this.#denque = new Denque()
  }
  
  // indexable cursor implementation
  at$$$(index) { return this.#denque.get(index) }
  setAt$$$(index, value) { this.#denque.set(index, value) }

  // container implementation
  get count$() { return this.#denque.length }

  push$(value) { this.#denque.push(value) }
  pop$() { return this.#denque.pop() }
  unshift$(value) { this.#denque.unshift(value) }
  shift$() { return this.#denque.shift() }
  dispose$() { this.#denque.clear() }
}
