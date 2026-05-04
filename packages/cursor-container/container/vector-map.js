import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import { IndexableCursor } from '../cursor/indexable-cursor.js'
import {
  OutputRangeConcept,
  RandomAccessRangeConcept,
} from '@kingjs/cursor'
import {
  ContainerPart,
  ClearableContainerPart,
  FrontEditableContainerPart,
  BackEditableContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
  EditableContainerPart,
} from '../container-parts.js'
import { 
  PartialIndexableContainer 
} from '../partial/partial-indexable-container.js'

export class VectorMap extends PartialProxy {
  static cursorType = IndexableCursor

  _array

  constructor(elements = []) { 
    super()
    this._array = elements
  }

  static {
    implement(this, RandomAccessRangeConcept)
    implement(this, OutputRangeConcept)

    extend(this, PartialIndexableContainer)

    extend(this, ClearableContainerPart, {
      clear() { this._array.length = 0 },
    })

    extend(this, FrontEditableContainerPart, {
      shift() { return this._array.shift() },
      unshift(value) { this._array.unshift(value) },
    })

    extend(this, BackEditableContainerPart, {
      push(value) { this._array.push(value) },
      pop() { return this._array.pop() },
    })

    extend(this, SizedContainerPart, {
      get count() { return this._array.length },
    })

    extend(this, IndexableContainerPart, {
      at(index) { return this._array[index] },
      setAt(index, value) { this._array[index] = value },
    })

    extend(this, EditableContainerPart, {
      insertAt(value, cursor) { this._array.splice(cursor.index, 0, value) },
      eraseAt(cursor) { 
        this._array.splice(cursor.index, 1)
        return cursor.clone()
      },
    })
  }
}
