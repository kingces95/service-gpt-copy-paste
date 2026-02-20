import Denque from "denque"
import { implement } from '@kingjs/implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
} from '../container-concepts.js'
import { IndexableCursor } from '../cursor/indexable-cursor.js'

const {
  partialContainerType$: PartialIndexableContainer,
} = IndexableCursor

export class Deque extends PartialProxy {
  static cursorType = IndexableCursor

  _denque
  
  constructor() { 
    super()
    this._denque = new Denque()
  }
  
  dispose$() { this._denque.clear() }

  static {
    extend(this, PartialIndexableContainer)

    implement(this, SequenceContainerConcept, {
      shift() { return this._denque.shift() },
      unshift(value) { this._denque.unshift(value) },
    })
    
    implement(this, RewindContainerConcept, {
      get count() { return this._denque.length },
      push(value) { this._denque.push(value) },
      pop() { return this._denque.pop() },
    })

    implement(this, IndexableContainerConcept, {
      at(index) { return this._denque.get(index) },
      setAt(index, offset, value) { throwNotSupported() },
    })
  }
}
