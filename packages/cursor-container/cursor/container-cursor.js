import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { CursorPart } from '@kingjs/cursor'

export class ContainerCursor extends PartialProxy {
  _container

  constructor(container) {
    super()
    this._container = container
  }

  get container() { return this._container }

  static {
    compose(this, CursorPart, {
      get range() { return this.container },
    }, {
      equals(other) { },
      get isAtEnd$() { },
      step() { },
    })
  }
}
