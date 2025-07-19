import Denque from "denque"
import { IndexableContainer } from "./indexable-container.js"
import {
  throwNotSupported,
} from '../../../../throw.js'

export class Deque extends IndexableContainer {
  __denque

  constructor() { 
    super()
    this.__denque = new Denque()
  }
  
  // indexable cursor implementation
  at$$$(index) { return this.__denque.get(index) }
  setAt$$$(index, value) { throwNotSupported() }

  // container implementation
  get count$() { return this.__denque.length }

  push$(value) { this.__denque.push(value) }
  pop$() { return this.__denque.pop() }
  unshift$(value) { this.__denque.unshift(value) }
  shift$() { return this.__denque.shift() }
  dispose$() { this.__denque.clear() }
}
