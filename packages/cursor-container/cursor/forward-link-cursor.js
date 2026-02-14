import { assert } from '@kingjs/assert'
import { Preconditions } from '@kingjs/partial-proxy'
import { implement } from '@kingjs/implement'
import { PartialClass } from '@kingjs/partial-class'
import { extend } from '@kingjs/partial-extend'
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
      extend(this, {
        isBeforeBegin(cursor) { return this.rootLink$ == cursor.link$ },
        isBegin(cursor) { return this.rootLink$.next == cursor.link$ },
        isEnd(cursor) { return this.endLink$ == cursor.link$ },
      })

      implement(this, {
        get rootLink$() { },
        get endLink$() { },
      })
      
      implement(this, ContainerConcept, {
        get isEmpty() { return this.endLink$ == this.rootLink$.next },
      })

      implement(this, SequenceContainerConcept, {
        get front() { return this.rootLink$.next.value },
        shift() { return this.removeAfter(this.beforeBegin()) },
        unshift(value) { this.insertAfter(this.beforeBegin(), value) },
      })

      implement(this, PrologContainerConcept, {
        beforeBegin() { return new this.cursorType(this, this.rootLink$) },
        insertAfter(cursor, value) { cursor.insertAfter$(value) },
        removeAfter(cursor) { return cursor.removeAfter$() },
      })
    }
  }

  static [Preconditions] = {
    step() {
      const { link$ : link } = this
      if (!this.__isActive$(link)) throwStale()
      //if (this.__isEnd$(link)) throwMoveOutOfBounds()
    }, 
    get value() {
      const { link$ : link } = this
      if (!this.__isActive$(link)) throwStale()
      // if (this.__isEnd$(link)) throwReadOutOfBounds()
      if (this.__isBeforeBegin$(link)) throwReadOutOfBounds()
    },
    set value(value) {
      const { link$ : link } = this
      if (!this.__isActive$(link)) throwStale()
      // if (this.__isEnd$(link)) throwWriteOutOfBounds()
      if (this.__isBeforeBegin$(link)) throwWriteOutOfBounds()
    },
  }

  link$

  constructor(container, link) {
    super(container)
    assert(link, 'link must be provided')
    this.link$ = link
  }

  static {
    extend(this, {   
      __isActive$() { return !!this.next },
      __isEnd$() {
        const { container$: container } = this
        return container.isEnd(this)
      },
      __isBeforeBegin$() { 
        const { container$: container } = this
        return container.isBeforeBegin(this)
      }
    })
  }

  static { 
    implement(this, {
      insertAfter$(value) { this.link$.insertAfter(value) },
      removeAfter$() { return this.link$.removeAfter() }
    })
  }

  static {
    implement(this, EquatableConcept, { 
      equals(other) { 
        if (!this.equatableTo(other)) return false
        return this.link$ == other.link$
      }
    })

    implement(this, CursorConcept, { 
      step() { 
        const { link$ : link } = this
        this.link$ = link.next
        return this
      },
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
