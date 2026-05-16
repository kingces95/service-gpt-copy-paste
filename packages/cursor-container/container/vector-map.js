import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  OutputRangeConcept,
  RandomAccessRangeConcept,
} from '@kingjs/cursor'
import { iterate } from '@kingjs/cursor-algorithm'
import { IndexableCursor } from '../cursor/indexable-cursor.js'
import {
  ContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
  EditableContainerPart,
  BulkEditableContainerPart,
} from '../container-parts.js'

export class VectorMap extends PartialProxy {
  static cursorType = IndexableCursor
  static {
    implement(this, OutputRangeConcept)
    implement(this, RandomAccessRangeConcept, {
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
    extend(this, ContainerPart, {
      insert(value, { at = this.begin() } = { }) { this.insertAt(value, at) },
      erase({ at = this.begin() } = { }) { this.eraseAt(at) },
    })

    extend(this, SizedContainerPart, {
      get size() { return this._array.length },
    })

    extend(this, IndexableContainerPart, {
      at(index) { return this._array[index] },
      setAt(index, value) { this._array[index] = value },
    })

    extend(this, BulkEditableContainerPart, {
      insertRange(cursor, first, last) {
        const offset = this.begin().distanceTo(cursor)
        this._array.splice(offset, 0, 
          ...Array.from(iterate(first, last)))
        return this
      },

      eraseRange(first, last) {
        const offset = this.begin().distanceTo(first)
        const count = first.distanceTo(last)
        this._array.splice(offset, count)
        return first
      },

      resizeTo(count, value = undefined) {
        if (count < this.size)
          this._array.length = count
        else
          this._array.splice(this.size, 0, 
            ...Array(count - this.size).fill(value))

        return this
      },

      assignRange(first, last) {
        this._array.splice(0, this._array.length, 
          ...Array.from(iterate(first, last)))
        return this
      }
    })

    extend(this, EditableContainerPart, {
      // insertAt(value, cursor) { this._array.splice(cursor.index, 0, value) },
      // eraseAt(cursor) { 
      //   this._array.splice(cursor.index, 1)
      //   return cursor.clone()
      // },
    })
  }
}
