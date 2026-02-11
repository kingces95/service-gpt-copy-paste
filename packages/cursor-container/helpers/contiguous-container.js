import { implement } from '@kingjs/implement'
import { SequenceContainer } from '../helpers/sequence-container.js'
import { RewindContainer } from "../helpers/rewind-container.js"
import { IndexableContainer } from "./indexable-container.js"
import { Preconditions } from '@kingjs/partial-proxy'
import { copyBackward, copyForward } from '@kingjs/cursor-algorithm'
import {
  ContiguousCursorConcept,
  throwNotImplemented,
} from '@kingjs/cursor'
import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
  ContiguousContainerConcept,
} from '../container-concepts.js'

export class ContiguousContainer extends IndexableContainer {
  static [Preconditions] = {
    readAt$({ index$:index }, offset, length, signed, littleEndian) {
      switch (length) {
        case 2: 
        case 4:
          if (!this.isInBounds$(index, offset + length)) throw new RangeError(
            `Cannot read ${length} byte(s) at index ${index + offset + length}.`)
        case 1:
          if (!this.isInBounds$(index, offset)) throw new RangeError(
            `Cannot read ${length} byte(s) at index ${index + offset}.`)
          break

        default:
          throw new Error(
            `Unsupported length: ${length}. Only 1, 2, or 4 bytes are supported.`)
      }
    }
  }

  static cursorType = class ContiguousCursor 
    extends IndexableContainer.cursorType {

    static api$ = class ContiguousContainerConcept$ 
      extends IndexableContainer.cursorType.api$ {
        
      readAt$(cursor, offset, length, signed, littleEndian) { }
      // data$(index, other) { }
    }

    constructor(contiguous, index) {
      super(contiguous, index)
    }
    
    static {
      implement(this, ContiguousCursorConcept, {
        readAt(offset = 0, length = 1, signed = false, littleEndian = false) {
          const { container$: contiguous } = this
          return contiguous.readAt$(this, offset, length, signed, littleEndian)
        },
        data(other) {
          const { container$: contiguous, index$: index } = this
          return contiguous.data$(index, other)
        }      
      }) 
    }
  }

  _length

  constructor(buffer) {
    super()
    this._length = 0
  }

  static {
    implement(this, SequenceContainer.cursorType.api$, {
    })
    implement(this, RewindContainer.cursorType.api$, {
    })
    implement(this, IndexableContainer.cursorType.api$, {
    })
    implement(this, ContiguousContainer.cursorType.api$, {
      // readAt$(cursor, offset, length, signed, littleEndian) { }
    })
  }

  static {
    implement(this, SequenceContainerConcept, {
      unshift(value) { this.insert(this.begin(), value) },
      shift() { return this.remove(this.begin()) },
    })
    implement(this, RewindContainerConcept, {
      get count() { return this._length },
      push(value) { this.insert(this.end(), value) },
      pop() { 
        const end = this.end()
        end.stepBack()
        return this.remove(end)
      }    
    })
    implement(this, IndexableContainerConcept, {
    })
    implement(this, ContiguousContainerConcept, {
    })
  }

  get capacity() { throwNotImplemented() }

  // contiguous container
  expand$(count) { throwNotImplemented() }
  expand() {
    this._length = this.expand$(this.capacity * 2)
  }

  insert(cursor, value) {
    if (this._length >= this.capacity$) this.expand()
    const end = this.end()
    this._length++
    const result = this.end()
    copyBackward(cursor, end, result)
    cursor.value = value    
  }
  remove(cursor) {
    const value = cursor.value
    const end = this.end()
    const after = cursor.clone()
    after.step()
    copyForward(after, end, cursor)
    this._length--
    return value
  }
}