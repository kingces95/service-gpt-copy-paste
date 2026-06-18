import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { implement } from '@kingjs/partial-implement'
import { assert } from '@kingjs/assert'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangeConcept } from '@kingjs/cursor'
import { VirtualContainerPart } from '../part/virtual-container-part.js'
import { CloneEmptyPart } from '../part/clone-empty-part.js'
import {
  subrange,
  TypedArrayView,
} from '@kingjs/cursor-view'
import {
  distance,
  iterate,
  next,
  previous,
} from '@kingjs/cursor-algorithm'
import {
  ContainerPart,
  List,
} from '@kingjs/cursor-container'
import { VirtualCursor } from '../cursor/virtual-cursor.js'
import { Page } from './page-container.js'
import {
  findSequence,
  findSequenceByCursor,
  lengthOfSequence,
} from '../algorithms/find-sequence.js'

// VirtualContainer stores pushed ranges and presents their values as one logical
// range. ranges() exposes the live stored-range view; mutating the container
// invalidates previously returned ranges views.
//
// popRange(cursor) removes everything before the cursor and returns another
// VirtualContainer containing the detached stored ranges.
export class VirtualContainer extends PartialProxy {
  static cursorType = VirtualCursor

  _ranges
  _tail
  _rangeOffsets
  _tailOffset

  constructor() {
    super()
    this._ranges = new List()
    this._tail = this._ranges.beforeBegin()
    this._rangeOffsets = new WeakMap()
    this._tailOffset = 0
  }

  _realize(cursor) {
    this.ownCursorAssert$(cursor)
    return cursor.getInnerCursor()
  }

  _virtualize(page, cursor) {
    return page.virtualize(cursor)
  }

  _pushStoredRange(storedRange) {
    this._rangeOffsets.set(storedRange, this._tailOffset)
    this._tailOffset += distance(storedRange)
    this._ranges.insertValueAfter(this._tail, storedRange)
    this._tail.step()
  }

  _replaceStoredRange(outerCursor, range, inner) {
    const prefix = new TypedArrayView(range.span(range.begin(), inner))
    const retained = new TypedArrayView(range.span(inner, range.end()))
    const offset = this._rangeOffsets.get(range)

    assert(offset != null, 'Stored range offset is required.')

    this._rangeOffsets.set(retained, offset + prefix.size)
    outerCursor.value = retained
    return prefix
  }

  _virtualizeMatch(page, match) {
    const begin = this._virtualize(page, match.begin)
    const end = this._virtualize(page, match.end)

    return begin && end ? { begin, end } : null
  }

  _fallbackBeginOfPage(page, sequence) {
    const virtualBegin = this._virtualize(page, page.begin())
    const virtualEnd = this._virtualize(page, page.end())
    const tailLength = lengthOfSequence(sequence) - 1

    if (tailLength <= 0)
      return null

    if (!virtualBegin || !virtualEnd)
      return null

    if (typeof virtualEnd.stepBack != 'function')
      return virtualBegin

    return previousBounded(virtualEnd, tailLength, virtualBegin)
  }

  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this, this._ranges.begin()) },
      end() { return new this.cursorType(this, this._ranges.end()) },
    })

    compose(this, ContainerPart, {
      get isEmpty() { return this._ranges.isEmpty },
    })

    compose(this, CloneEmptyPart, {
      cloneEmpty() {
        return new this.constructor()
      },
    })

    compose(this, VirtualContainerPart, {
      pushRange(range) {
        const span = range.span()
        assert(span instanceof Uint8Array,
          'Virtual container ranges must expose Uint8Array spans.')

        if (span.length == 0)
          return this

        this._pushStoredRange(range)
        return this
      },

      popRange(cursor = this.end()) {
        const result = new this.constructor()
        const before = this._ranges.beforeBegin()

        while (!next(before).equals(cursor.outerCursor$)) {
          result.pushRange(next(before).value)
          this._ranges.eraseAfter(before)
        }

        if (!cursor.outerCursor$.equals(this._ranges.end())) {
          const range = cursor.popRangePrefix()
          if (range)
            result.pushRange(range)
        }

        if (this._ranges.isEmpty)
          this._tail = this._ranges.beforeBegin()

        return result
      },

      ranges() {
        return this._ranges
      },
    })

    define(this, {
      *pages(begin = this.begin(), end = this.end()) {
        this.ownCursorAssert$(begin)
        this.ownCursorAssert$(end)

        let current = begin.clone()
        let offset = 0

        while (!current.equals(end)) {
          const pageBegin = this._realize(current)
          const pageEnd = current.outerCursor$.equals(end.outerCursor$)
            ? this._realize(end)
            : current.getInnerCursorEnd()
          const outerCursor = current.outerCursor$.clone()
          const virtualEnd = current.outerCursor$.equals(end.outerCursor$)
            ? end.clone()
            : current.clone()

          if (!current.outerCursor$.equals(end.outerCursor$)) {
            virtualEnd.outerCursor$.step()
            virtualEnd.resetInnerCursor()
          }

          const range = subrange(pageBegin, pageEnd)

          yield new Page(range, {
            offset,
            virtualize: cursor => {
              if (cursor.equals(pageEnd))
                return virtualEnd.clone()

              return new this.cursorType(
                this,
                outerCursor.clone(),
                cursor.clone(),
                pageEnd.clone()
              )
            },
          })

          if (current.outerCursor$.equals(end.outerCursor$))
            break

          offset += distance(range)
          current.outerCursor$.step()
          current.resetInnerCursor()
        }
      },

      materialize(begin = this.begin(), end = this.end()) {
        const result = new this.constructor()

        for (const page of this.pages(begin, end))
          result.pushRange(page.range)

        return result
      },

      offsetOf(cursor) {
        this.ownCursorAssert$(cursor)

        if (cursor.outerCursor$.equals(this._ranges.end()))
          return this._tailOffset

        const range = cursor.storedRange
        const offset = this._rangeOffsets.get(range)

        assert(offset != null, 'Stored range offset is required.')
        return offset + distance(subrange(range.begin(), this._realize(cursor)))
      },

      findSequence(sequence, { from = this.begin() } = { }) {
        for (const page of this.pages(from, this.end())) {
          const pageMatch = findSequence(page, sequence)
          const match = pageMatch && this._virtualizeMatch(page, pageMatch)

          if (match)
            return match

          const virtualBegin = this._fallbackBeginOfPage(page, sequence)
          const virtualEnd = this._virtualize(page, page.end())

          if (!virtualBegin || !virtualEnd)
            continue

          const virtualMatch = findSequenceByCursor(this, sequence, {
            from: virtualBegin,
            until: virtualEnd,
          })

          if (virtualMatch)
            return virtualMatch
        }

        return null
      },
    })
  }
}

function previousBounded(cursor, count, begin) {
  cursor = cursor.clone()

  for (let i = 0; i < count && !cursor.equals(begin); i++)
    cursor = previous(cursor)

  return cursor
}
