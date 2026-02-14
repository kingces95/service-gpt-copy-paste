import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/implement'
import { extend } from '@kingjs/partial-extend'
import { ListNode } from "./list-node.js"
import { Container } from './container.js'
import { SequenceContainer } from "../helpers/sequence-container.js"
import {
  ContainerConcept,
  PrologContainerConcept,
  SequenceContainerConcept,
} from "../container-concepts.js"
import {
  ForwardLinkCursor
} from '../helpers/forward-link-cursor.js'

const {
  linkType$: ForwardLink,
  partialLinkContainerType$: PartialForwardLinkContainer,
} = ForwardLinkCursor

export class List$ extends Container {
  static cursorType = ForwardLinkCursor

  rootLink$
  endLink$

  constructor() {
    super()
    const root = new this.constructor.cursorType.linkType$()
    assert(root instanceof ForwardLink, 
      'linkType must be a ForwardLink')
    this.rootLink$ = root
    this.endLink$ = root.insertAfter()
  }

  dispose$() {
    super.dispose$()
    this.rootLink$ = null
    this.endLink$ = null
  }

  static {
    extend(this, {
      beginToken$() { return this.rootLink$.next },
      endToken$() { return this.endLink$ },
    })

    extend(this, PartialForwardLinkContainer)
  }
}

export class List extends SequenceContainer {
  _root
  _end

  constructor() { 
    super()
    this._root = new ListNode()
    this._end = this._root.insertAfter() 
  }

  __isActive$(link) { return !!link.next }
  __isEnd$(link) { return link == this._end }
  __isBeforeBegin$(link) { return link == this._root }
  
  dispose$() { 
    this._root = null 
    this._end = null
  }

  static {
    implement(this, SequenceContainer.cursorType.api$.linked$, {
      equals$({ token$: link }, { token$: otherLink }) { 
        return link == otherLink },
      step$({ token$: link }) { return link.next },
      value$({ token$: link }) { return link.value },
      setValue$({ token$: link }, value) { link.value = value },
    })
  }

  static {
    extend(this, {
      beginToken$() { return this._root.next },
      endToken$() { return this._end },
    })

    implement(this, ContainerConcept, {
      get isEmpty() { return this._end == this._root.next },
    })

    implement(this, PrologContainerConcept, {
      beforeBegin() { return new this.cursorType(this, this._root) },
      insertAfter(cursor, value) { cursor.token$.insertAfter(value) },
      removeAfter(cursor) { return cursor.token$.removeAfter() },
    })

    implement(this, SequenceContainerConcept, {
      get front() { return this._root.next.value },
      unshift(value) { this.insertAfter(this.beforeBegin(), value) },
      shift() { return this.removeAfter(this.beforeBegin()) },
    })
  }
}
