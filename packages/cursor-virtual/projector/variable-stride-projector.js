import { Projector } from './projector.js'

export class VariableStrideProjector extends Projector {
  _isContinuation

  constructor(container, { isContinuation }) {
    super(container)
    this._isContinuation = isContinuation
  }

  isSynchronized(sourceCursor) {
    if (sourceCursor.equals(this.container.source.end()))
      return true

    return !this._isContinuation(sourceCursor.value)
  }

  synchronize(sourceCursor) {
    const cursor = sourceCursor.clone()

    while (!this.isSynchronized(cursor)) {
      if (cursor.equals(this.container.source.begin()))
        return null

      cursor.stepBack()
    }

    return cursor
  }
}
