import { implement } from '@kingjs/implement'
import { IndexableContainer } from "./indexable-container.js"
import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept$,
} from '../../../container-concepts.js'

export class Vector extends IndexableContainer {
  _array

  constructor(elements = []) { 
    super()
    this._array = elements
  }

  static {
    implement(this, IndexableContainerConcept$, {
      at$(index, offset) { return this._array[index + offset] },
      setAt$(index, offset, value) { this._array[index + offset] = value },
    })
    implement(this, SequenceContainerConcept, {
      shift() { return this._array.shift() },
      unshift(value) { this._array.unshift(value) },
    })
    implement(this, RewindContainerConcept, {
      get count() { return this._array.length },
      push(value) { this._array.push(value) },
      pop() { return this._array.pop() },
    })
  }

  // container
  dispose$() { this._array.length = 0 }
}
