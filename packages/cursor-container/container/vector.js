import { implement } from '@kingjs/partial-implement'
import { Lazy } from '@kingjs/lazy'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  copy,
  copyBackward,
} from '@kingjs/cursor-algorithm'
import { subrange } from '@kingjs/cursor-view'
import {
  RangeConcept,
} from '@kingjs/cursor'
import {
  ContiguousCursor,
} from '../cursor/contiguous-cursor.js'
import {
  SizedContainerPart,
  IndexableContainerPartOf,
  CapacityContainerPart,
  ReservableContainerPart,
  ByteContainerPartOf,
  BulkAssignableContainerPartOf,
  GapEditableContainerPartOf,
  GapAssignableContainerPartOf,
} from '../container-parts.js'
import { genericType } from '@kingjs/generic'
import { assert } from '@kingjs/assert'
import { ConstructsOf } from '@kingjs/simple-type'
import {
  TypedArrayConstructorProbe,
  TypedArrayProbe,
  typedArrayDefaultValueOf,
  typedArrayValueTypeOf,
} from '@kingjs/probe-typed-array'

export const VectorOf = genericType([
  Function,
  [
    TypedArrayConstructorProbe,
    ConstructsOf(TypedArrayProbe),
  ],
],
(
  TValue = Number,
  TArray = Float64Array,
) => {
  assert(typedArrayValueTypeOf(TArray) == TValue,
    'Vector array value type must match TValue.')

  return class Vector extends PartialProxy {
    static cursorType = ContiguousCursor
    static valueType = TValue
    static spanType = TArray
    static defaultValue = typedArrayDefaultValueOf(TArray)
    static bytesPerValue = TArray.BYTES_PER_ELEMENT

    _size
    _storage

    constructor(capacity = 8) {
      super()
      this._size = 0
      this._storage = new Lazy(() => new TArray(capacity))
    }

    get storage() { return this._storage.value }

    static {
      implement(this, RangeConcept, {
        begin() { return new this.cursorType(this, 0) },
        end() { return new this.cursorType(this, this.size) },
      })
    }

    static {
      compose(this, SizedContainerPart, {
        get size() { return this._size }
      })

      compose(this, IndexableContainerPartOf(TValue), {
        at(index) { return this.storage[index] },
        setAt(index, value) { this.storage[index] = value },
      })

      compose(this, BulkAssignableContainerPartOf(TValue), {
        get defaultValue$() { return this.constructor.defaultValue },
      }, {
        // Implemented later by GapAssignableContainerPart.
        resize(count, value) { },
        assignRange(range) { },
      })

      compose(this, GapEditableContainerPartOf(TValue), {
        openGap$(cursor, count) {
          const oldEnd = this.end()
          this.reserve(this.size + count)
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

      compose(this, GapAssignableContainerPartOf(TValue))

      compose(this, CapacityContainerPart, {
        get capacity() { return this.storage.length },
      })

      compose(this, ReservableContainerPart, {
        setCapacity$(capacity) {
          const newVector = new this.constructor(capacity)
          copy(newVector.begin(), subrange(this.begin(), this.end()))

          const { _storage, _size } = newVector
          this._storage = _storage
          this._size = _size

          return capacity
        },
      })

      compose(this, ByteContainerPartOf(TValue), {
        span(begin = this.begin(), end = this.end()) {
          return this.storage.subarray(begin.index, end.index)
        },
      })
    }
  }
})
