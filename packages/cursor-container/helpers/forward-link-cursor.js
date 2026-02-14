import { assert } from '@kingjs/assert'
import { Preconditions } from '@kingjs/partial-proxy'
import { implement } from '@kingjs/implement'
import { PartialClass } from '@kingjs/partial-class'
import {
  EquatableConcept,
} from '@kingjs/concept'
import {
  CursorConcept,
  CursorFactoryConcept,
  MutableCursorConcept,
  ForwardCursorConcept,

  throwStale,
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import { 
  ContainerConcept,
  PrologContainerConcept,
  SequenceContainerConcept,
} from '../container-concepts.js'
import { ContainerCursor } from './container-cursor.js'

export class ForwardLinkCursor extends ContainerCursor {

  static linkType$ = class ForwardLink {
    static __id = 0

    #value
    #next
    #__id = ForwardLink.__id++

    constructor(value) {
      this.#value = value
      this.#next = this
    }

    setNext$(node) { this.#next = node }

    get value() { return this.#value }
    set value(value) { this.#value = value }
    get next() { return this.#next }

    insertAfter(value) {
      const { constructor: ctor } = this
      const node = new ctor(value)
      node.setNext$(this.next)
      this.setNext$(node)
      return node
    }
    removeAfter() {
      const node = this.next
      this.setNext$(node.next)
      node.setNext$(null)
      return node.value
    }
  }

  static partialLinkContainerType$ = class PartialForwardLinkContainer
    extends PartialClass {

    static [Preconditions] = {
      shift() { if (this.isEmpty) throwEmpty() },
      get front() { if (this.isEmpty) throwEmpty() },

      insertAfter(cursor, value) {
        const { container$ : container, link$ : link } = cursor
        if (container != this) throwNotEquatableTo()
        if (this.__isEnd$(link)) throwUpdateOutOfBounds()
      },
      removeAfter(cursor) {
        const { container$ : container, link$ : link } = cursor
        if (container != this) throwNotEquatableTo()
        if (this.__isEnd$(link)) throwUpdateOutOfBounds()
      }
    }

    static {
      implement(this, {
        get rootLink$() { },
        get endLink$() { },
      })

      implement(this, ContainerConcept, {
        get isEmpty() { return this.endLink$ == this.rootLink$.next },
      })

      implement(this, SequenceContainerConcept, {
        get front() { return this.rootLink$.next.value },
        unshift(value) { this.insertAfter(this.beforeBegin(), value) },
        shift() { return this.removeAfter(this.beforeBegin()) },
      })

      implement(this, PrologContainerConcept, {
        beforeBegin() { return new this.cursorType(this, this.rootLink$) },
        insertAfter(cursor, value) { cursor.insertAfter$(value) },
        removeAfter(cursor) { return cursor.removeAfter$() },
      })
    }
  }

  static [Preconditions] = {
    set value(value) {
      const { link$ : link } = this
      if (!this.__isActive$(link)) throwStale()
      if (this.__isEnd$(link)) throwWriteOutOfBounds()
      if (this.__isBeforeBegin$(link)) throwWriteOutOfBounds()
    },
    get value() {
      const { link$ : link } = this
      if (!this.__isActive$(link)) throwStale()
      if (this.__isEnd$(link)) throwReadOutOfBounds()
      if (this.__isBeforeBegin$(link)) throwReadOutOfBounds()
    },
    step() {
      const { link$ : link } = this
      if (!this.__isActive$(link)) throwStale()
      if (this.__isEnd$(link)) throwMoveOutOfBounds()
    }, 
  }

  link$

  constructor(container, link) {
    super(container)
    assert(link, 'link must be provided')
    this.link$ = link
  }

  __isActive$() { return !!this.next }
  __isEnd$() {
    const { link$: link, container$: { endLink$: endLink } } = this
    return link == endLink 
  }
  __isBeforeBegin$() { 
    const { link$: link, container$: { rootLink$: rootLink } } = this
    return link == rootLink 
  }

  static { 
    implement(this, {
      insertAfter$(value) { this.link$.insertAfter(value) },
      removeAfter$() { return this.link$.removeAfter() }
    })

    implement(this, EquatableConcept, { 
      equals(other) { 
        if (!this.equatableTo(other)) return false
        return this.link$ == other.link$
      }
    })

    implement(this, CursorConcept, { 
      step() { return this.next },
    })

    implement(this, MutableCursorConcept, { 
      get value() { return this.link$.value },
      set value(value) { this.link$.value = value },
    })

    implement(this, ForwardCursorConcept, {
      clone() {
        const {
          constructor, 
          container$: container, 
          link$: link 
        } = this

        return new constructor(container, link)
      }
    }) 
  }
}
