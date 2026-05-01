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
  MutableCursorConcept,
  ForwardCursorConcept,
  RangeConcept,

  throwNull,
  throwUpdateOutOfBounds,
  throwNotEquatableTo,
} from '@kingjs/cursor'
import { 
  ContainerPart,
  ForwardContainerPart,
  FrontEditableContainerPart,
  OutputContainerPart,
} from '../container-concepts.js'
import { 
  ContainerCursor,
} from '../cursor/container-cursor.js'
import { ForwardLink } from '../helpers/forward-link.js'

class ListCursor extends ContainerCursor {
  static linkType$ = ForwardLink

  constructor(container, link) {
    super(container, link)
  }

  get link() { return this.token }
  set link(link) { this.token = link }

  static {
    define(this, {
      __isActive$() { return !!this.next },
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

  static [Preconditions] = {
    insertAfter(cursor, value) {
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

  dispose$() {
    this._rootLink = null
    this._endLink = null
  }

  static {
    define(this, {
      beforeBegin() { return new this.cursorType(this, this._rootLink) },
      insertAfter(cursor, value) { cursor.link.insertAfter(value) },
      eraseAfter(cursor) { 
        cursor.link.eraseAfter() 
        return cursor.clone().step()
      },
    })

    extend(this, ContainerPart, {
      get isEmpty() { return this._endLink == this._rootLink.next },
    })

    extend(this, ForwardContainerPart)

    extend(this, OutputContainerPart)

    extend(this, FrontEditableContainerPart, {
      get front() { return this._rootLink.next.value },
      shift() { 
        const result = this._rootLink.next.value
        this.eraseAfter(this.beforeBegin())
        return result
      },
      unshift(value) { this.insertAfter(this.beforeBegin(), value) },
    })

    implement(this, RangeConcept, {
      get cursorType() { return this.constructor.cursorType },
      begin() { return new this.cursorType(this, this._rootLink.next) },
      end() { return new this.cursorType(this, this._endLink) },
    })
  }
}
