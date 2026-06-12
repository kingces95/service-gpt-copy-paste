import { compose } from '@kingjs/partial-compose'
import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { define } from '@kingjs/partial-define'
import { PartialProxy } from '@kingjs/partial-proxy'
import { genericType } from '@kingjs/generic'
import { RangeConcept } from '@kingjs/cursor'
import { RangeOfRangesPartOf } from '../part/range-of-ranges-part.js'
import { CloneEmptyPart } from '../part/clone-empty-part.js'
import {
  subrange,
} from '@kingjs/cursor-view'
import {
  next,
} from '@kingjs/cursor-algorithm'
import {
  spanTypeOfRange,
  spansOfRange,
} from '@kingjs/cursor-shape'
import {
  ContainerPart,
  List,
} from '@kingjs/cursor-container'
import {
  RangeContainerCursorOf,
} from '../cursor/range-container-cursor.js'

function clone(cursor) {
  return cursor?.clone?.() ?? cursor
}

function toStoredRange(range) {
  return subrange(
    clone(range.begin()),
    clone(range.end())
  )
}

function assertSpanType(range, span) {
  assert(span instanceof spanTypeOfRange(range),
    'Range span type must match spanType.')
}

// RangeContainer stores pushed ranges and presents their values as one logical
// range. ranges() exposes the live stored-range view; mutating the container
// invalidates previously returned ranges views.
//
// popRange(cursor) removes everything before the cursor and returns another
// RangeContainer containing the detached stored ranges.
export const RangeContainerOf = genericType(TSpan => {
  const RangeOfRangesPart = RangeOfRangesPartOf(TSpan)
  const RangeContainerCursor = RangeContainerCursorOf(TSpan)

  return class RangeContainer extends PartialProxy {
    static cursorType = RangeContainerCursor

    _ranges
    _tail

    constructor() {
      super()
      this._ranges = new List()
      this._tail = this._ranges.beforeBegin()
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

      compose(this, RangeOfRangesPart, {
        pushRange(range) {
          const storedRange = toStoredRange(range)
          if (storedRange.begin().equals(storedRange.end()))
            return this

          this._ranges.insertValueAfter(this._tail, storedRange)
          this._tail.step()
          return this
        },

        popRange(cursor = this.end()) {
          const result = new this.constructor()
          const before = this._ranges.beforeBegin()

          while (!next(before).equals(cursor.outerCursor)) {
            result.pushRange(next(before).value)
            this._ranges.eraseAfter(before)
          }

          if (!cursor.outerCursor.equals(this._ranges.end())) {
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

        *spans() {
          const end = this._ranges.end()

          for (
            const outerCursor = this._ranges.begin();
            !outerCursor.equals(end);
            outerCursor.step()
          ) {
            const storedRange = outerCursor.value
            const outerCursorForSpan = outerCursor.clone()

            for (const descriptor of spansOfRange(storedRange)) {
              const { span } = descriptor
              const descriptorEnd = descriptor.cursorAt(span.length)
              assertSpanType(this, span)

              yield {
                span,
                cursorAt: offset => {
                  if (offset == span.length &&
                    descriptorEnd.equals(storedRange.end())) {
                    const outerEnd = outerCursorForSpan.clone()
                    outerEnd.step()
                    return new this.cursorType(this, outerEnd)
                  }

                  return new this.cursorType(
                    this,
                    outerCursorForSpan.clone(),
                    descriptor.cursorAt(offset),
                    descriptorEnd
                  )
                },
              }
            }
          }
        },
      })
    }
  }
})

export const RangeContainer = RangeContainerOf(Object)
