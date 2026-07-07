import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { assert } from '@kingjs/assert'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangeConcept } from '@kingjs/cursor'
import { RangeContainerPart } from '../part/range-container-part.js'
import {
  TypedArrayView,
} from '@kingjs/cursor-view'
import {
  advance,
  iterate,
} from '@kingjs/cursor-algorithm'
import {
  ContainerPart,
  Deque,
} from '@kingjs/cursor-container'
import { VirtualCursor } from '../cursor/virtual-cursor.js'
import {
  findBytesInSpans,
} from '../algorithms/find-bytes-in-spans.js'

// VirtualContainer stores pushed ranges and presents their values as one logical
// range. ranges() exposes the live stored-range view; mutating the container
// invalidates previously returned ranges views. Consuming ranges also
// invalidates cursors into the mutated container; clients should reacquire
// cursors after popRangeAt(), popRange(), or split().
//
// popRangeAt(cursor) removes everything before the cursor and returns another
// VirtualContainer containing the detached stored ranges.
export class VirtualContainer extends PartialProxy {
  static cursorType = VirtualCursor

  _bytesPopped
  _bytesPushed
  _pages

  constructor() {
    super()
    this._bytesPopped = 0
    this._bytesPushed = 0
    this._pages = new Deque()
  }

  _pushStoredRange(range) {
    this._pages.pushBack(range)
  }

  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this, this._pages.begin()) },
      end() { return new this.cursorType(this, this._pages.end()) },
    })

    compose(this, ContainerPart, {
      get isEmpty() { return this._pages.isEmpty },
    })

    compose(this, RangeContainerPart, {
      get bytesPopped() { return this._bytesPopped },
      get bytesPushed() { return this._bytesPushed },

      pushRange(range) {
        const span = range.span()
        if (span.length == 0)
          return this

        this._pushStoredRange(range)
        this._bytesPushed += span.length
        return this
      },

      pushBytes(bytes) {
        return this.pushRange(new TypedArrayView(bytes))
      },

      popAll() {
        return this.popRangeAt(this.end())
      },

      popBytes(byteCount) {
        return this.popRangeAt(advance(this.begin(), byteCount))
      },

      popRangeAt(cursor = this.end()) {
        const result = new this.constructor()
        const atEnd = cursor.pageCursor$.equals(this._pages.end())
        const count = cursor.pageCursor$.index
        const rangeCursor = atEnd ? null : cursor.rangeCursor$

        for (let i = 0; i < count; i++)
          result.pushRange(this._pages.popFront())

        if (!atEnd) {
          const page = this._pages.begin()
          const range = page.value
          const begin = range.begin()

          if (!begin.equals(rangeCursor)) {
            const end = range.end()
            const prefix = new TypedArrayView(range.span(begin, rangeCursor))
            const retained = new TypedArrayView(range.span(rangeCursor, end))

            page.value = retained
            result.pushRange(prefix)
          }
        }

        this._bytesPopped += result.bytesPushed
        return result
      },

      popRange$(needle) {
        assert(needle,
          'Virtual needle must match virtual range or be a Uint8Array.')
        assert(needle instanceof Uint8Array,
          'Virtual needle must materialize to a Uint8Array.')

        if (needle.length == 0)
          return new this.constructor()

        const match = findBytesInSpans(this.spans(), needle)
        if (!match)
          return null

        const pageCursor = advance(this._pages.begin(), match.spanIndex)
        const rangeCursor = advance(pageCursor.value.begin(), match.spanOffset)
        const begin = new this.cursorType(this, pageCursor, rangeCursor)

        return this.popRangeAt(advance(begin.clone(), needle.length))
      },

      *ranges() {
        for (const range of iterate(this._pages))
          yield range
      },
    })
  }
}
