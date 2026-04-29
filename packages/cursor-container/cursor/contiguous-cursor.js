import { implement } from '@kingjs/partial-implement'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  ContiguousCursorConcept,
} from '@kingjs/cursor'

import {
  FrontEditableContainerConcept,
  BackEditableContainerConcept,
  SizedContainerConcept,
  IndexableContainerConcept,
  ReservableContainerConcept,
  ByteContainerConept,
  ContiguousContainerConcept,
  OutputContainerConcept,
  EditableContainerConcept,
} from '../container-concepts.js'
import { IndexableCursor } from './indexable-cursor.js'
import { assert } from '@kingjs/assert'

export class ContiguousCursor extends IndexableCursor {

  static partialContainerType$ = class PartialContiguousContainer 
    extends IndexableCursor.partialContainerType$ {

    static [Preconditions] = {
      setCapacity(count) {
        if (count < this.capacity) throw new RangeError(
          `Cannot shrink buffer from ${this.capacity} to ${count}.`)
      },
      readAt(index, length = 1, signed = false, littleEndian = false) {
        assert([1, 2, 4].includes(length),
          `Unsupported length: ${length}. Only 1, 2, or 4 bytes are supported.`)
        
        if (index < 0) throw new RangeError(
          `Cannot read at negative index: ${index}.`)

        if (index + length > this.count) throw new RangeError(
          `Cannot read ${length} byte(s) at index ${index + length}.`)
      },
      copy(cursor, begin, end) {
        assert(cursor?.range?.constructor == this.constructor)
        assert(begin?.range == this)
        assert(end?.range == this)
      },
      data(begin = this.begin(), end = this.end()) {
        const { index: beginIndex } = begin
        const { index: endIndex } = end
        assert(beginIndex >= 0, 
          `Cannot read at negative index: ${beginIndex}.`)
        assert(endIndex <= this.count, 
          `Cannot read at index ${endIndex}.`)        
      },
      insert(begin, end) { 
        return
      },
      erase(begin, end) { 
        return
      }
    }

    static {
      implement(this, ContiguousContainerConcept)
      implement(this, OutputContainerConcept)
  
      implement(this, FrontEditableContainerConcept, {
        unshift(value) { this.insert(this.begin(), value) },
        shift() { 
          const begin = this.begin()
          const result = begin.value
          this.erase(begin)
          return result
        },
      })

      implement(this, BackEditableContainerConcept, {
        push(value) { this.insert(this.end(), value) },
        pop() { 
          const end = this.end()
          end.stepBack()
          const value = end.value
          this.erase(end)
          return value
        }
      })

      implement(this, IndexableContainerConcept, { 
        // none
      }, {
        at(index) { },
        setAt(index, value) { },
      })

      implement(this, SizedContainerConcept, { 
        // none
      }, {
        get count() { return this._count }
      })

      implement(this, ReservableContainerConcept, {
        // none
      }, {
        get capacity() { },
        setCapacity(count) { },
      })

      implement(this, ByteContainerConept, {
        // none
      }, {
        copy(cursor, begin, end) { },
        writeAt(index, value, length, signed, littleEndian) { },
        readAt(index, length, signed, littleEndian) { },
        data(index, other) { },
      })
    }
  }

  constructor(indexable, index) {
    super(indexable, index)
  }

  static { 
    implement(this, ContiguousCursorConcept, {
      data(other) { return this.container.data(this, other) },      
      readAt(offset = 0, length = 1, signed = false, littleEndian = false) {
        const { container } = this
        const index = this.index + offset
        return container.readAt(index, length, signed, littleEndian)
      },
      writeAt(offset = 0, value, length = 1, signed = false, littleEndian = false) {
        const { container } = this
        const index = this.index + offset
        return container.writeAt(index, value, length, signed, littleEndian)
      }
    }) 
  }
}

