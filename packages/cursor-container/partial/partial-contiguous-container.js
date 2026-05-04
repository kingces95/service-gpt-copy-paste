import { assert } from '@kingjs/assert'
import { extend } from '@kingjs/partial-extend'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  OutputRangeConcept,
  ContiguousRangeConcept,
} from '@kingjs/cursor'
import {
  FrontEditableContainerPart,
  BackEditableContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
  ReservableContainerPart,
  ByteContainerPart,
} from '../container-parts.js'
import { ContiguousCursor } from '../cursor/contiguous-cursor.js'
import { PartialIndexableContainer } from './partial-indexable-container.js'
import { implement } from '@kingjs/partial-implement'

export class PartialContiguousContainer extends PartialIndexableContainer {
    static cursorType = ContiguousCursor

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
      eraseAt(begin, end) { 
        return
      }
    }

    static {
      implement(this, ContiguousRangeConcept)
      implement(this, OutputRangeConcept)
  
      extend(this, FrontEditableContainerPart, {
        unshift(value) { this.insertAt(value, this.begin()) },
        shift() { 
          const begin = this.begin()
          const result = begin.value
          this.eraseAt(begin)
          return result
        },
      })

      extend(this, BackEditableContainerPart, {
        push(value) { this.insertAt(value, this.end()) },
        pop() { 
          const end = this.end()
          end.stepBack()
          const value = end.value
          this.eraseAt(end)
          return value
        }
      })

      extend(this, IndexableContainerPart, { 
        // none
      }, {
        at(index) { },
        setAt(index, value) { },
      })

      extend(this, SizedContainerPart, { 
        // none
      }, {
        get count() { return this._count }
      })

      extend(this, ReservableContainerPart, {
        // none
      }, {
        get capacity() { },
        setCapacity(count) { },
      })

      extend(this, ByteContainerPart, {
        // none
      }, {
        copy(cursor, begin, end) { },
        writeAt(index, value, length, signed, littleEndian) { },
        readAt(index, length, signed, littleEndian) { },
        data(index, other) { },
      })
    }
  }