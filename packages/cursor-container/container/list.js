import { assert } from '@kingjs/assert'
import { extend } from '@kingjs/partial-extend'
import { implement } from '@kingjs/implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  EquatableConcept,
} from '@kingjs/concept'
import {
  CursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,

  throwWriteOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import { 
  ContainerConcept,
  PrologContainerConcept,
  SequenceContainerConcept,
} from '../container-concepts.js'
import { 
  ContainerCursor,
} from '../cursor/container-cursor.js'
import { ForwardLink } from '../helpers/forward-link.js'

class ListCursor extends ContainerCursor {
  static linkType$ = ForwardLink

  static [Preconditions] = {
    get value() { if (this.isBeforeBegin) throwReadOutOfBounds() },
    set value(value) { if (this.isBeforeBegin) throwWriteOutOfBounds() }
  }

  constructor(container, link) {
    super(container, link)
  }

  get link() { return this.token }
  set link(link) { this.token = link }
  get isBeforeBegin() { return this.token === this.container._rootLink }

  static {
    extend(this, {
      __isActive$() { return !!this.next },
    })
  }

  static { 
    implement(this, {
      insertAfter$(value) { this.link.insertAfter(value) },
      removeAfter$() { return this.link.removeAfter() }
    })
  }

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
}

export class List extends PartialProxy {
  static cursorType = ListCursor

  _rootLink
  _endLink

  constructor() {
    super()
    const root = new this.constructor.cursorType.linkType$()
    assert(root instanceof ForwardLink, 'linkType must be a ForwardLink')
    this._rootLink = root
    this._endLink = root.insertAfter()
  }

  dispose$() {
    super.dispose$()
    this._rootLink = null
    this._endLink = null
  }

  static {

    implement(this, ContainerConcept, {
      get isEmpty() { return this._endLink == this._rootLink.next },
    })

    implement(this, SequenceContainerConcept, {
      get front() { return this._rootLink.next.value },
      shift() { return this.removeAfter(this.beforeBegin()) },
      unshift(value) { this.insertAfter(this.beforeBegin(), value) },
    })

    implement(this, PrologContainerConcept, {
      beforeBegin() { return new this.cursorType(this, this._rootLink) },
      insertAfter(cursor, value) { cursor.insertAfter$(value) },
      removeAfter(cursor) { return cursor.removeAfter$() },
    })

    implement(this, ContainerConcept, {
      get cursorType() { return this.constructor.cursorType },
      begin() { return new this.cursorType(this, this._rootLink.next) },
      end() { return new this.cursorType(this, this._endLink) },
    })
  }
}
