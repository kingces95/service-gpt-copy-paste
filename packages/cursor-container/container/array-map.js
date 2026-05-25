import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  RangeConcept,
} from '@kingjs/cursor'
import { iterate } from '@kingjs/cursor-algorithm'
import { IndexableCursor } from '../cursor/indexable-cursor.js'
import {
  ContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
  EditableContainerPart,
  GapAssignableContainerPart,
} from '../container-parts.js'

export class ArrayMap extends PartialProxy {
  static cursorType = IndexableCursor
  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.size) },
    })
  }

  _array

  constructor() { 
    super()
    this._array = []
  }

  static {
    extend(this, ContainerPart)

    extend(this, SizedContainerPart, {
      get size() { return this._array.length },
    })

    extend(this, IndexableContainerPart, {
      at(index) { return this._array[index] },
      setAt(index, value) { this._array[index] = value },
    })

    extend(this, GapAssignableContainerPart, {
      openGap$(cursor, count) {
        const offset = this.begin().distanceTo(cursor)
        this._array.splice(offset, 0, ...Array(count))
        return cursor
      },

      closeGap$(first, last) {
        const offset = this.begin().distanceTo(first)
        const count = first.distanceTo(last)
        this._array.splice(offset, count)
        return first
      },

      insertRange(cursor, range) {
        range = this.sourceRange$(range)

        const offset = this.begin().distanceTo(cursor)
        this._array.splice(offset, 0, 
          ...Array.from(iterate(range)))
        return this
      },
    })
  }
}
