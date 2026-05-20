import { assert } from '@kingjs/assert'
import { define } from '@kingjs/partial-define'
import { extend } from '@kingjs/partial-extend'
import { implement } from '@kingjs/partial-implement'
import { PartialProxy, Preconditions } from '@kingjs/partial-proxy'
import {
  EquatableConcept,
} from '@kingjs/partial-concept'
import {
  CursorConcept,
  CursorPart,
  MutableCursorConcept,
  InputCursorPart,
  OutputCursorPart,
  ForwardCursorConcept,
  RangeConcept,
  OutputRangeConcept,
  ForwardRangeConcept,

  throwNull,
  throwUpdateOutOfBounds,
  throwNotEquatableTo,
} from '@kingjs/cursor'
import { 
  ContainerPart,
  BulkAssignableContainerPart,
  AfterBulkEditableContainerPart,
  FrontEditableContainerPart,
} from '../container-parts.js'
import { iterate } from '@kingjs/cursor-algorithm'
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

    implement(this, CursorConcept, { 
      step() { 
        this.link = this.link.next
        return this
      },
    })

    implement(this, MutableCursorConcept, { 
      get value() { return this.link.value },
      set value(value) { this.link.value = value },
    })

    implement(this, ForwardCursorConcept, {
      clone() {
        const { constructor, container, link } = this
        return new constructor(container, link)
      }
    })
  }

  static {
    extend(this, CursorPart, {
      isAtEnd$() { return this.link == this.container._endLink },
      canStep$() { return this.link != this.container._endLink },
    })

    extend(this, InputCursorPart, {
      isAccessible$() { return this.link != this.container._endLink },
    })

    extend(this, OutputCursorPart, {
      isAccessible$() { return this.link != this.container._endLink },
    })
  }
}

export class ForwardList extends PartialProxy {
  static cursorType = ForwardListCursor
  static {
    implement(this, ForwardRangeConcept, {
      begin() { return new this.cursorType(this, this._rootLink.next) },
      end() { return new this.cursorType(this, this._endLink) },
    })
    implement(this, OutputRangeConcept)
  }

  static [Preconditions] = {
    insertAfter(value, cursor) {
      if (!cursor) throwNull()
      if (cursor.range != this) throwNotEquatableTo()
      const end = this.end({ fixed: true })
      if (cursor.equals(end)) throwUpdateOutOfBounds()
    },
    eraseAfter(cursor) {
      if (!cursor) throwNull()
      if (cursor.range != this) throwNotEquatableTo()
      const end = this.end({ fixed: true })
      if (cursor.equals(end)) throwUpdateOutOfBounds()
      const next = cursor.clone().step()
      if (next.equals(end)) throwUpdateOutOfBounds()
    }
  }

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
    define(this, {
      beforeBegin() { return new this.cursorType(this, this._rootLink) },
      insertAfter(value, cursor) { cursor.link.insertAfter(value) },
      eraseAfter(cursor) { 
        cursor.link.eraseAfter() 
        return cursor.clone().step()
      },
    })
  }

  static {
    extend(this, ContainerPart, {
      get isEmpty() { return this._endLink == this._rootLink.next },
      insert(value, { after = this.beforeBegin() } = { }) { 
        this.insertAfter(value, after) 
      },
      erase({ after = this.beforeBegin() } = { }) { this.eraseAfter(after) },
    })

    extend(this, FrontEditableContainerPart, {
      shift() { 
        const result = this._rootLink.next.value
        this.eraseAfter(this.beforeBegin())
        return result
      },
      unshift(value) { this.insertAfter(value, this.beforeBegin()) },
    })

    extend(this, BulkAssignableContainerPart, {
      resizeTo(count, value = undefined) {
        let tail = this.beforeBegin()

        while (count > 0) {
          const next = tail.clone().step()
          if (next.equals(this.end())) {
            tail.link = tail.link.insertAfter(value)
          }
          else {
            tail = next
          }

          count--
        }

        while (!tail.clone().step().equals(this.end()))
          this.eraseAfter(tail)

        return this
      },

      assignRange(range) {
        range = this.sourceRange$(range)

        this.clear()
        let tail = this.beforeBegin()
        for (const value of iterate(range)) {
          tail.link = tail.link.insertAfter(value)
        }

        return this
      },
    })

    extend(this, AfterBulkEditableContainerPart, {
      insertRangeAfter(cursor, range) {
        range = this.sourceRange$(range)

        const tail = cursor.clone()
        for (const value of iterate(range))
          tail.link = tail.link.insertAfter(value)

        return this
      },

      eraseRangeAfter(first, last) {
        while (!first.clone().step().equals(last))
          this.eraseAfter(first)

        return last
      },
    })

  }
}
