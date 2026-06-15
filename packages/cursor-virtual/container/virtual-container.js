import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangeConcept } from '@kingjs/cursor'
import { VirtualContainerPart } from '../part/virtual-container-part.js'
import { CloneEmptyPart } from '../part/clone-empty-part.js'
import {
  subrange,
} from '@kingjs/cursor-view'
import {
  distance,
  iterate,
  next,
} from '@kingjs/cursor-algorithm'
import {
  ContainerPart,
  List,
} from '@kingjs/cursor-container'
import { VirtualCursor } from '../cursor/virtual-cursor.js'
import { Page } from './page-container.js'

function clone(cursor) {
  return cursor?.clone?.() ?? cursor
}

function toStoredRange(range) {
  return subrange(
    clone(range.begin()),
    clone(range.end())
  )
}

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

    compose(this, VirtualContainerPart, {
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
          const pageBegin = current.getInnerCursor()
          const pageEnd = current.outerCursor$.equals(end.outerCursor$)
            ? end.getInnerCursor()
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
    })
  }
}
