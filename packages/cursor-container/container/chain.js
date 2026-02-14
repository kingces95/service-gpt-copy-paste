import { extend } from '@kingjs/partial-extend'
import { List } from './list.js'
import { RewindLinkCursor } from '../cursor/rewind-link-cursor.js'

const {
  linkType$: RewindLink,
  partialLinkContainerType$: PartialRewindLinkContainer,
} = RewindLinkCursor

export class Chain extends List {
  static cursorType = RewindLinkCursor

  count$

  constructor() {
    super()
    const { root, end } = RewindLink.createEntangledPair()
    this.root$ = root
    this.end$ = end
    this.count$ = 0
  }

  dispose$() {
    super.dispose$()
    this.root$ = null
    this.end$ = null
    this.count$ = 0
  }

  static {
    extend(this, {
      incrementCount$() { this.count$++ },
      decrementCount$() { this.count$-- }
    })

    extend(this, PartialRewindLinkContainer)
  }
}
