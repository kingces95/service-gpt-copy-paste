import { extend } from '@kingjs/partial-extend'
import { List } from './list.js'
import { RewindLinkCursor } from '../cursor/rewind-link-cursor.js'

const {
  partialLinkContainerType$: PartialRewindLinkContainer,
} = RewindLinkCursor

export class Chain extends List {
  static cursorType = RewindLinkCursor

  count$

  constructor() {
    super()
    this.count$ = 0
  }

  dispose$() {
    super.dispose$()
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
