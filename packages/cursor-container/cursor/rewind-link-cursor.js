import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/implement'
import { extend } from '@kingjs/partial-extend'
import {
  BidirectionalCursorConcept,
} from '@kingjs/cursor'
import { 
  RewindContainerConcept,
  PrologContainerConcept,
  EpilogContainerConcept,
} from '../container-concepts.js'
import {
  LinkedBidirectionalContainerCursorConcept
} from '../container-cursor-concepts.js'
import { ForwardLinkCursor } from './forward-link-cursor.js'

const {
  linkType$: ForwardLink,
  partialContainerType$: PartialForwardLinkContainer,
} = ForwardLinkCursor

export class RewindLinkCursor extends ForwardLinkCursor {

  static linkType$ = class RewindLink extends ForwardLink {
    #previous
  
    constructor(value) {
      super(value)
      this.#previous = this
    }
  
    setPrevious$(node) { this.#previous = node }
  
    get previous() { return this.#previous }
  
    insertAfter(value) {
      const node = super.insertAfter(value)
      node.setPrevious$(this)
      node.next.setPrevious$(node)
      return node
    }
    removeAfter() {
      const node = this.next
      const nextNode = node.next
      const result = super.removeAfter()
      node.setPrevious$(null)
      nextNode.setPrevious$(this)
      return result
    }
  
    insert(value) { return this.previous.insertAfter(value) }
    remove() { return this.previous.removeAfter() }
  }
   
  static partialContainerType$ = class PartialRewindLinkContainer
    extends PartialForwardLinkContainer {

    static {
      extend(this, {
        incrementCount$() { },
        decrementCount$() { },
      })

      implement(this, PrologContainerConcept, {
        insertAfter(cursor, value) {
          super.insertAfter(cursor, value)
          this.incrementCount$()
        },
        removeAfter(cursor) {
          const result = super.removeAfter(cursor)
          this.decrementCount$()
          return result
        },
      })

      implement(this, RewindContainerConcept, {
        get back() { return this.endLink$.previous.value },
        push(value) { 
          this.insert(this.end(), value),
          this.incrementCount$()
        },
        pop() {
          const cursor = this.end()
          cursor.stepBack()
          const result = this.remove(cursor)
          this.decrementCount$()
          return result
        },
      })

      implement(this, EpilogContainerConcept, {
        insert(cursor, value) {
          const { link$ : link } = cursor
          link.insert(value)
          this.incrementCount$()
        },
        remove(cursor) {
          const { link$ : link } = cursor
          const result = link.remove()
          this.decrementCount$()
          return result
        }
      })
    }
  }

  constructor(reversible, link) {
    super(reversible, link)
  }

  static { 
    implement(this, BidirectionalCursorConcept, {
      stepBack() {
        const { link$: link } = this
        this.link$ = link.previous
        assert(this.link$)
        return this
      }    
    }) 

    implement(this, LinkedBidirectionalContainerCursorConcept)
  }
}
