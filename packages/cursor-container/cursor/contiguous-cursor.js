import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/partial-proxy'
import { copyBackward, copyForward } from '@kingjs/cursor-algorithm'
import {
  ContiguousCursorConcept,
} from '@kingjs/cursor'

import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
  BufferContainerConcept,
  EpilogContainerConcept,
  PrologContainerConcept,
} from '../container-concepts.js'
import { IndexableCursor } from './indexable-cursor.js'
import { assert } from '@kingjs/assert'

export class ContiguousCursor extends IndexableCursor {

  static partialContainerType$ = class PartialContiguousContainer 
    extends IndexableCursor.partialContainerType$ {

    static [Preconditions] = {
      readAt(index, length, signed, littleEndian) {
        assert([1, 2, 4].includes(length),
          `Unsupported length: ${length}. Only 1, 2, or 4 bytes are supported.`)
        
        if (index < 0) throw new RangeError(
          `Cannot read at negative index: ${index}.`)

        if (index + length > this.count) throw new RangeError(
          `Cannot read ${length} byte(s) at index ${index + length}.`)
      },
      insert(begin, end) { 
        // nyi
      },
      remove(begin, end) { 
        // nyi
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

      implement(this, BufferContainerConcept, {
        readAt(index, length, signed, littleEndian) { },
        data(index, other) { },
        expand(count) { },
        capacity(count) { },
        insertRange(begin, end) { },
        removeRange(begin, end) { },
      })

      implement(this, PrologContainerConcept, {
        insertAfter(cursor, value) { },
        removeAfter(cursor) { },
      })

      implement(this, EpilogContainerConcept, {
         insert(cursor, value) {
          if (this._length >= this.capacity$) {
            this.expand(this.capacity * 2 || 4)
            return this.insert(cursor, value)
          }
          const end = this.end()
          this._length++
          const result = this.end()
          copyBackward(cursor, end, result)
          cursor.value = value    
        },
        remove(cursor) {
          const value = cursor.value
          const end = this.end()
          const after = cursor.clone()
          after.step()
          copyForward(after, end, cursor)
          this._length--
          return value
        }         
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
    }) 
  }
}

