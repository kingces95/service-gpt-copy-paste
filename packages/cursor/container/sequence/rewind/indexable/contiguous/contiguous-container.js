import { ContiguousCursor } from './contiguous-cursor.js'
import { IndexableContainer } from "../indexable-container.js"
import { copyBackward } from '../../../../../algorithm/bidirectional/copy-backward.js'
import { copyForward } from '../../../../../algorithm/copy-forward.js'
import {
  throwNotImplemented,
} from '../../../../../throw.js'

export class ContiguousContainer extends IndexableContainer {

  static get cursorType$() { return ContiguousCursor }

  __length

  constructor(buffer) {
    super()
    this.__length = 0
  }

  // cursor implementation
  data$$(index, cursor) { throwNotImplemented() }
  readAt$$(index, offset, length, signed, littleEndian) {
    throwNotImplemented()
  }

  // cursor proxy
  data$(index, cursor) {
    return this.data$$(index, cursor)
  }
  readAt$(index, offset, length, signed, littleEndian) {
    switch (length) {
      case 2: 
      case 4:
        if (!this.isInBounds$(index, offset + length)) throw new RangeError(
          `Cannot read ${length} byte(s) at index ${index + offset + length}.`)
      case 1:
        if (!this.isInBounds$(index, offset)) throw new RangeError(
          `Cannot read ${length} byte(s) at index ${index + offset}.`)
        return this.readAt$$(index, offset, length, signed, littleEndian)

      default:
        throw new Error(
          `Unsupported length: ${length}. Only 1, 2, or 4 bytes are supported.`)
    }
  }

  get capacity$() { throwNotImplemented() }
  get count$() { return this.__length }

  expand$(count) { throwNotImplemented() }
  push$(value) { this.insert(this.end(), value) }
  unshift$(value) { this.insert(this.begin(), value) }
  pop$() { 
    const end = this.end()
    end.stepBack()
    return this.erase(end)
  }
  shift$() { return this.erase(this.begin()) }

  get capacity() { return this.capacity$ }

  expand() {
    this.__length = this.expand$(this.capacity * 2)
  }
  insert(cursor, value) {
    if (this.__length >= this.capacity$) this.expand()
    const end = this.end()
    this.__length++
    const result = this.end()
    copyBackward(cursor, end, result)
    cursor.value = value    
  }
  erase(cursor) {
    const value = cursor.value
    const end = this.end()
    const after = cursor.clone()
    after.step()
    copyForward(after, end, cursor)
    this.__length--
    return value
  }
}