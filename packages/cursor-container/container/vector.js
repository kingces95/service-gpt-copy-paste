import { implement } from '@kingjs/implement'
import { IndexableContainer } from "../helpers/indexable-container.js"
import { extend } from '@kingjs/partial-extend'
import {
  SequenceContainerConcept,
  RewindContainerConcept,
} from '../container-concepts.js'
import {
  IndexableContainerConcept$,
} from '../helpers/container-cursor-api.js'

export class Vector extends IndexableContainer {
  _array

  constructor(elements = []) { 
    super()
    this._array = elements
  }

  static {
    extend(this, {
      at$$(index) { return this._array[index] },
      setAt$$(index, value) { this._array[index] = value },
    })
    implement(this, IndexableContainerConcept$, {
      at$({ index$: index }, offset) { 
        return this.at$$(index, offset) },
      setAt$({ index$: index }, offset, value) { 
        this.setAt$$(index, offset, value) },
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
