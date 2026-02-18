import { assert } from '@kingjs/assert'
import { extend } from '@kingjs/partial-extend'
import { Container } from '../container.js'
import {
  ForwardLinkCursor
} from '../cursor/forward-link-cursor.js'

const {
  linkType$: ForwardLink,
  partialContainerType$: PartialForwardLinkContainer,
} = ForwardLinkCursor

export class List extends Container {
  static cursorType = ForwardLinkCursor

  rootLink$
  endLink$

  constructor() {
    super()
    const root = new this.constructor.cursorType.linkType$()
    assert(root instanceof ForwardLink, 'linkType must be a ForwardLink')
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
