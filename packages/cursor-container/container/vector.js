import { implement } from '@kingjs/implement'
import { extend } from '@kingjs/partial-extend'
import { Container } from '../container.js'
import { IndexableCursor } from '../cursor/indexable-cursor.js'
import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
} from '../container-concepts.js'

const {
  partialContainerType$: PartialIndexableContainer,
} = IndexableCursor

export class Vector extends Container {
  static cursorType = IndexableCursor

  _array

  constructor(elements = []) { 
    super()
    this._array = elements
  }

  dispose$() { this._array.length = 0 }

  static {
    extend(this, PartialIndexableContainer)

    implement(this, SequenceContainerConcept, {
      shift() { return this._array.shift() },
      unshift(value) { this._array.unshift(value) },
    })

    implement(this, RewindContainerConcept, {
      get count() { return this._array.length },
      push(value) { this._array.push(value) },
      pop() { return this._array.pop() },
    })

    implement(this, IndexableContainerConcept, {
      at(index) { return this._array[index] },
      setAt(index, value) { this._array[index] = value },
    })
  }
}
