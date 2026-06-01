import { implement } from '@kingjs/partial-implement'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { thunk } from '@kingjs/function-contract'
import {
  RangeConcept,
} from '@kingjs/cursor'
import { iterate } from '@kingjs/cursor-algorithm'
import { IndexableCursor } from '../cursor/indexable-cursor.js'
import {
  SizedContainerPart,
  IndexableContainerPart,
  GapEditableContainerPart,
  GapAssignableContainerPart,
  sourceRange,
} from '../container-parts.js'

export class ArrayMap extends PartialProxy {
  static cursorType = IndexableCursor

  _array

  constructor() { 
    super()
    this._array = []
  }

  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.size) },
    })
  }

  static {
    compose(this, SizedContainerPart, {
      get size() { return this._array.length },
    })

    compose(this, IndexableContainerPart, {
      at(index) { return this._array[index] },
      setAt(index, value) { this._array[index] = value },
    })

    compose(this, GapEditableContainerPart, {
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

      insertRange: thunk({
        transforms: [null, sourceRange],
        method(cursor, range) {
          const offset = this.begin().distanceTo(cursor)
          this._array.splice(offset, 0,
            ...Array.from(iterate(range)))
          return this
        },
      }),
    })

    compose(this, GapAssignableContainerPart)
  }
}
