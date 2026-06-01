import { assert } from '@kingjs/assert'
import { thunk } from '@kingjs/function-contract'
import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  EquatableConcept,
} from '@kingjs/partial-concept'
import {
  RangeConcept,
  CloneableCursorPart,
  CursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
  WritableCursorPart,
} from '@kingjs/cursor'
import {
  ContainerPart,
  BulkAssignableContainerPart,
  PhasedContainerPart,
  PhasedBulkContainerPart,
  FrontInsertableContainerPart,
  sourceRange,
} from '../container-parts.js'
import { iterate, next } from '@kingjs/cursor-algorithm'
import {
  ContainerCursor,
} from '../cursor/container-cursor.js'
import { ForwardLink } from '../link/forward-link.js'

class ForwardListCursor extends ContainerCursor {
  static linkType$ = ForwardLink

  constructor(container, link) {
    super(container, link)
  }

  get link() { return this.token }
  set link(link) { this.token = link }

  static {
    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this.link == other.link
      }
    })

  }

  static {
    compose(this, CursorPart, {
      get isAtEnd$() { return this.link == this.container._endLink },
    })

    compose(this, SteppableCursorPart, {
      step() {
        this.link = this.link.next
        return this
      },

      canStep$() { return this.link != this.container._endLink },
    })

    compose(this, ReadableCursorPart, {
      get value() { return this.link.value },
      isReadable$() { return this.link != this.container._endLink },
    })

    compose(this, WritableCursorPart, {
      set value(value) { this.link.value = value },
      isWritable$() { return this.link != this.container._endLink },
    })

    compose(this, CloneableCursorPart, {
      clone() {
        const { constructor, container, link } = this
        return new constructor(container, link)
      }
    })
  }
}

export class ForwardList extends PartialProxy {
  static cursorType = ForwardListCursor

  _rootLink
  _endLink

  constructor() {
    super()
    const root = new this.constructor.cursorType.linkType$()
    assert(root instanceof ForwardLink, 'linkType must be a ForwardLink')
    this._rootLink = root
    this._endLink = root.insertAfter()
  }

  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this, this._rootLink.next) },
      end() { return new this.cursorType(this, this._endLink) },
    })
  }

  static {
    compose(this, ContainerPart, {
      get isEmpty() { return this._endLink == this._rootLink.next },
    })

    compose(this, FrontInsertableContainerPart, {
      popFront() {
        const result = this._rootLink.next.value
        this.eraseAfter(this.beforeBegin())
        return result
      },
      pushFront(value) { this.insertValueAfter(this.beforeBegin(), value) },
    })

    compose(this, BulkAssignableContainerPart, {
      resize(count, value = undefined) {
        let tail = this.beforeBegin()

        while (count > 0) {
          const nextCursor = next(tail)
          if (nextCursor.equals(this.end())) {
            tail.link = tail.link.insertAfter(value)
          }
          else {
            tail = nextCursor
          }

          count--
        }

        while (!next(tail).equals(this.end()))
          this.eraseAfter(tail)

        return this
      },

      assignRange: thunk({
        transforms: [sourceRange],
        method(range) {
          this.clear()
          let tail = this.beforeBegin()
          for (const value of iterate(range)) {
            tail.link = tail.link.insertAfter(value)
          }

          return this
        },
      }),
    })

    compose(this, PhasedContainerPart, {
      beforeBegin() { return new this.cursorType(this, this._rootLink) },

      insertValueAfter(cursor, value) {
        cursor.link.insertAfter(value)
      },

      eraseAfter(first, last = next(first, 2)) {
        while (!next(first).equals(last))
          first.link.eraseAfter()

        return last
      },
    })

    compose(this, PhasedBulkContainerPart, {
      insertRangeAfter: thunk({
        transforms: [null, sourceRange],
        method(cursor, range) {
          const tail = cursor.clone()
          for (const value of iterate(range))
            tail.link = tail.link.insertAfter(value)

          return this
        },
      }),
    })
  }
}
