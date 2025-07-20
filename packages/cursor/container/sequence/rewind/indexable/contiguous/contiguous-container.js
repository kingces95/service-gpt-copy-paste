import { ContiguousCursor } from './contiguous-cursor.js'
import { IndexableContainer } from "../indexable-container.js"
import { Preconditions } from '@kingjs/debug-proxy'
import { copyBackward } from '../../../../../algorithm/bidirectional/copy-backward.js'
import { copyForward } from '../../../../../algorithm/copy-forward.js'
import {
  throwNotImplemented,
} from '../../../../../throw.js'

export class ContiguousContainer extends IndexableContainer {
  static [Preconditions] = class extends IndexableContainer[Preconditions] {
    readAt$(index, offset, length, signed, littleEndian) {
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

  static get cursorType$() { return ContiguousCursor }

  #length

  constructor(buffer) {
    super()
    this.#length = 0
  }

  get capacity() { throwNotImplemented() }

  // contiguous cursor
  readAt$(index, offset, length, signed, littleEndian) { throwNotImplemented() }

  // forward container
  unshift(value) { this.insert(this.begin(), value) }
  shift() { return this.remove(this.begin()) }

  // rewind container
  get count() { return this.#length }
  push(value) { this.insert(this.end(), value) }
  pop() { 
    const end = this.end()
    end.stepBack()
    return this.remove(end)
  }
  
  // contiguous container
  expand$(count) { throwNotImplemented() }
  expand() {
    this.#length = this.expand$(this.capacity * 2)
  }

  insert(cursor, value) {
    if (this.#length >= this.capacity$) this.expand()
    const end = this.end()
    this.#length++
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
    this.#length--
    return value
  }
}