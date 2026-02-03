import Denque from "denque"
import { implement } from '@kingjs/implement'
import {
  throwNotSupported,
} from '@kingjs/cursor'
import { 
  IndexableContainer 
} from "./indexable-container.js"
import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept$,
} from "../../../container-concepts.js"

export class Deque extends IndexableContainer {
  _denque
  
  constructor() { 
    super()
    this._denque = new Denque()
  }
  
  static {
    implement(this, IndexableContainerConcept$, {
      at$(index) { return this._denque.get(index) },
      setAt$(index, offset, value) { throwNotSupported() },
    })
    implement(this, SequenceContainerConcept, {
      unshift(value) { this._denque.unshift(value) },
      shift() { return this._denque.shift() },
    })
    implement(this, RewindContainerConcept, {
      get count() { return this._denque.length },
      push(value) { this._denque.push(value) },
      pop() { return this._denque.pop() },
    })
  }
  
  // container
  dispose$() { this._denque.clear() }
}
