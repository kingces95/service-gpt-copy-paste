import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { Lazy } from '@kingjs/lazy'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import { 
  copy,
  copyBackward,
} from '@kingjs/cursor-algorithm'
import { materialize } from '../algorithms/materialize.js'
import { 
  ContiguousRangeConcept, 
  RandomAccessCursorConcept,
  OutputRangeConcept,
} from '@kingjs/cursor'
import { 
  ContiguousCursor,
} from '../cursor/contiguous-cursor.js'
import {
  ContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
  ReservableContainerPart,
  ByteContainerPart,
  BulkEditableContainerPart,
} from '../container-parts.js'

export class Vector extends PartialProxy {
  static cursorType = ContiguousCursor
  static {
    implement(this, OutputRangeConcept)
    implement(this, ContiguousRangeConcept, {
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.size) },
    })
  }

  _size
  _bytes
  _buffer

  constructor(capacity = 8) {
    super()
    this._size = 0
    this._bytes = new ArrayBuffer(capacity)
    this._buffer = new Lazy(() => new this.spanType(this._bytes))
  }

  get buffer() { return this._buffer.value }

  static {
    extend(this, ContainerPart, {
      insert(value, { at = this.begin() } = { }) { this.insertAt(value, at) },
      erase({ at = this.begin() } = { }) { this.eraseAt(at) },
    })

    extend(this, SizedContainerPart, {
      get size() { return this._size }
    })

    extend(this, IndexableContainerPart, {
      at(index) { return this.buffer[index] },
      setAt(index, value) { this.buffer[index] = value },
    })

    extend(this, BulkEditableContainerPart, {
      insertRange(cursor, first, last) {
        if (first instanceof RandomAccessCursorConcept == false) {
          const vectorMap = materialize(first, last)
          first = vectorMap.begin()
          last = vectorMap.end()
        }

        const count = first.distanceTo(last)
        this.ensureCapacity(this.size + count)
        this._size += count

        copy(cursor, first, last)
        return this
      },

      eraseRange(first, last) {
        if (first instanceof RandomAccessCursorConcept == false) {
          const vectorMap = materialize(first, last)
          first = vectorMap.begin()
          last = vectorMap.end()
        }

        copy(first, last, this.end())
        const count = first.distanceTo(last)
        this._size -= count
        
        const result = last.clone()
        return result
      },

      resizeTo(count, value = 0) {
        const oldSize = this.size
        this.ensureCapacity(count)
        this._size = count
        if (count > oldSize)
          fill(this.cursorAt(oldSize), count - oldSize, value)
        return this
      },

      assignRange(first, last) {
        if (first instanceof RandomAccessCursorConcept == false) {
          const vectorMap = materialize(first, last)
          first = vectorMap.begin()
          last = vectorMap.end()
        }

        const count = first.distanceTo(last)
        this.ensureCapacity(count)
        this._size = count

        copy(this.begin(), first, last)
        return this
      }
    })

    extend(this, ReservableContainerPart, {
      get capacity() { return this._bytes.byteLength },
      setCapacity(capacity) {
        const newVector = new this.constructor(capacity)
        copy(newVector.begin(), this.begin(), this.end())
        
        const { _bytes, _buffer, _size } = newVector
        this._bytes = _bytes
        this._buffer = _buffer
        this._size = _size

        return capacity
      },
    })

    extend(this, ByteContainerPart, {
      span(begin = this.begin(), end = this.end()) { 
        return this.buffer.subarray(begin.index, end.index)
      },
    })
  }
}

export class Uint8Vector extends Vector {
  static spanType = Uint8Array
}
export class Uint16Vector extends Vector {
  static spanType = Uint16Array
}
export class Uint32Vector extends Vector {
  static spanType = Uint32Array
}
export class Float64Vector extends Vector {
  static spanType = Float64Array
}
