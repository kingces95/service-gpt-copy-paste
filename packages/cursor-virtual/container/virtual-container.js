import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { assert } from '@kingjs/assert'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangeConcept } from '@kingjs/cursor'
import { RangeContainerPart } from '../part/range-container-part.js'
import { SplittableRangePart } from '../part/splittable-range-part.js'
import {
  subrange,
  TypedArrayView,
} from '@kingjs/cursor-view'
import {
  advance,
  iterate,
  next,
  retreat,
} from '@kingjs/cursor-algorithm'
import {
  ContainerPart,
  List,
} from '@kingjs/cursor-container'
import { VirtualCursor } from '../cursor/virtual-cursor.js'
import { Page } from './page-container.js'
import {
  findSequence,
} from '../algorithms/find-sequence.js'

// VirtualContainer stores pushed ranges and presents their values as one logical
// range. ranges() exposes the live stored-range view; mutating the container
// invalidates previously returned ranges views.
//
// popRangeAt(cursor) removes everything before the cursor and returns another
// VirtualContainer containing the detached stored ranges.
export class VirtualContainer extends PartialProxy {
  static cursorType = VirtualCursor

  _pages
  _pageTail

  constructor() {
    super()
    this._pages = new List()
    this._pageTail = this._pages.beforeBegin()
  }

  _pushStoredPage(page) {
    this._pages.insertValueAfter(this._pageTail, page)
    this._pageTail.step()
    page._attach(this, this._pageTail)
  }

  _replaceStoredPage(outerCursor, page, inner) {
    const range = page.range
    const prefix = new TypedArrayView(range.span(range.begin(), inner))
    const retained = new TypedArrayView(range.span(inner, range.end()))
    outerCursor.value = new Page(retained)._attach(this, outerCursor)
    return prefix
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
      pushRange(range) {
        const span = range.span()
        if (span.length == 0)
          return this

        this._pushStoredPage(new Page(range))
        return this
      },

      popRangeAt(cursor = this.end()) {
        const result = new this.constructor()
        const before = this._pages.beforeBegin()

        while (!next(before).equals(cursor.outerCursor$)) {
          result.pushRange(next(before).value.range)
          this._pages.eraseAfter(before)
        }

        if (!cursor.outerCursor$.equals(this._pages.end())) {
          const range = cursor.popRangePrefix()
          if (range)
            result.pushRange(range)
        }

        if (this._pages.isEmpty)
          this._pageTail = this._pages.beforeBegin()

        return result
      },

      popRange(sequence, { includeNeedle = true } = { }) {
        const needle = sequence instanceof Uint8Array
          ? sequence
          : sequence instanceof this.constructor
            ? sequence.materialize()
            : null

        assert(needle,
          'Virtual sequence must match virtual range or be a Uint8Array.')
        assert(needle instanceof Uint8Array,
          'Virtual sequence must materialize to a Uint8Array.')

        if (needle.length == 0)
          return new this.constructor()

        const tailLength = needle.length - 1
        let current = this.begin()
        const end = this.end()
        while (!current.equals(end)) {
          const page = current.storedPage
          const pageMatch = page.findSequence(needle)
          if (pageMatch)
            return popRange(this, pageMatch, includeNeedle)

          const pageEnd = page.end()
          const from = retreat(pageEnd.clone(), tailLength, current)
          const until = advance(pageEnd.clone(), tailLength, end)
          const match = findSequence(subrange(from, until), needle)
          if (match)
            return popRange(this, match, includeNeedle)

          current = pageEnd
        }

        return null
      },

      ranges() {
        const result = new List()
        let tail = result.beforeBegin()

        for (const page of iterate(this._pages)) {
          result.insertValueAfter(tail, page.range)
          tail.step()
        }

        return result
      },
    })

    compose(this, SplittableRangePart)
  }
}

function popRange(container, match, includeNeedle) {
  if (includeNeedle)
    return container.popRangeAt(match.end)

  const result = container.popRangeAt(match.begin)
  container.popRangeAt(match.end)
  return result
}
