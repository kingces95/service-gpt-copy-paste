import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import { IndexableCursor } from '../cursor/indexable-cursor.js'
import {
  FrontEditableContainerConcept,
  BackEditableContainerConcept,
  SizedContainerConcept,
  IndexableContainerConcept,
  OutputContainerConcept,
  RandomAccessContainerConcept,
  EditableContainerConcept,
} from '../container-concepts.js'

const {
  partialContainerType$: PartialIndexableContainer,
} = IndexableCursor

export class Vector extends PartialProxy {
  static cursorType = IndexableCursor

  _array

  constructor(elements = []) { 
    super()
    this._array = elements
  }

  dispose$() { this._array.length = 0 }

  static {
    extend(this, PartialIndexableContainer)

    implement(this, RandomAccessContainerConcept)
    implement(this, OutputContainerConcept)

    implement(this, FrontEditableContainerConcept, {
      shift() { return this._array.shift() },
      unshift(value) { this._array.unshift(value) },
    })

    implement(this, BackEditableContainerConcept, {
      push(value) { this._array.push(value) },
      pop() { return this._array.pop() },
    })

    implement(this, SizedContainerConcept, {
      get count() { return this._array.length },
    })

    implement(this, IndexableContainerConcept, {
      at(index) { return this._array[index] },
      setAt(index, value) { this._array[index] = value },
    })

    implement(this, EditableContainerConcept, {
      insert(cursor, value) { this._array.splice(cursor.index, 0, value) },
      erase(cursor) { 
        this._array.splice(cursor.index, 1)
        return cursor.clone()
      },
    })
  }
}
