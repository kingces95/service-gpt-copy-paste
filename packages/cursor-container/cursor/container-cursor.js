import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { CursorConcept } from '@kingjs/cursor'

export class ContainerCursor extends PartialProxy {
  _container

  constructor(container) {
    super()
    this._container = container
  }

  get container() { return this._container }

  static {
    implement(this, CursorConcept, {
      get range() { return this.container },
    }, {
      step() { },
    })
  }
}
