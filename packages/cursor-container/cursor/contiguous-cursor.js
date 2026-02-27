import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  ContiguousCursorConcept,
} from '@kingjs/cursor'

import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
  BufferContainerConcept,
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
      remove(begin, end) { 
        return
      }
    }

    static {
      implement(this, SequenceContainerConcept, {
        unshift(value) { this.insert(this.begin(), value) },
        shift() { return this.remove(this.begin()) },
      })

      implement(this, RewindContainerConcept, {
        push(value) { this.insert(this.end(), value) },
        pop() { 
          const end = this.end()
          end.stepBack()
          return this.remove(end)
        }    
      }, {
        get count() { },
      })

      implement(this, IndexableContainerConcept, { 
        // none
      }, {
        at(index) { },
        setAt(index, value) { },
      })

      implement(this, EditableContainerConcept, {
        insert(cursor, value) {
          const begin = cursor.clone()
          const end = this.end()
          this.ensureCapacity(this.count + 1)
          this._count++
          const cursorPlusOne = cursor.clone().step()
          this.copy(cursorPlusOne, begin, end)
          cursor.value = value
        },
        remove(cursor) {
          const value = cursor.value
          const target = cursor.clone()
          const begin = cursor.step()
          const end = this.end()
          this.copy(target, begin, end)
          this._count--
          return value
        }         
      })

      implement(this, BufferContainerConcept, {
        // none
      }, {
        get capacity() { },
        setCapacity(count) { },
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
      data(other) { return this.container.data(this.index, other) },      
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

