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
import { subrange } from '@kingjs/cursor-view'
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
  GapEditableContainerPart,
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

    extend(this, GapEditableContainerPart, {
      get defaultValue$() { return 0 },

      insertRange(cursor, range) {
        range = this.sourceRange$(range)

        let first = range.begin()
        let last = range.end()

        if (first instanceof RandomAccessCursorConcept == false) {
          const arrayMap = materialize(range)
          first = arrayMap.begin()
          last = arrayMap.end()
          range = arrayMap
        }

        const count = first.distanceTo(last)
        this.openGap$(cursor, count)
        copy(cursor, range)
        return this
      },

      openGap$(cursor, count) {
        const oldEnd = this.end()
        this.ensureCapacity(this.size + count)
        this._size += count

        copyBackward(this.end(), cursor, oldEnd)
        return cursor
      },

      closeGap$(first, last) {
        const count = first.distanceTo(last)
        copy(first, subrange(last, this.end()))
        this._size -= count
        return first
      }
    })

    extend(this, ReservableContainerPart, {
      get capacity() { return this._bytes.byteLength },
      setCapacity(capacity) {
        const newVector = new this.constructor(capacity)
        copy(newVector.begin(), subrange(this.begin(), this.end()))
        
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
