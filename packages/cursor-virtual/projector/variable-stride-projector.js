import { Projector } from './projector.js'

export class VariableStrideProjector extends Projector {
  _isContinuation

  constructor(container, { isContinuation }) {
    super(container)
    this._isContinuation = isContinuation
  }

  isSynchronized(page, sourceCursor) {
    if (sourceCursor.equals(page.end()))
      return true

    return !this._isContinuation(sourceCursor.value)
  }

  synchronize(page, sourceCursor) {
    const cursor = sourceCursor.clone()

    while (!this.isSynchronized(page, cursor)) {
      if (cursor.equals(page.begin()))
        return null

      cursor.stepBack()
    }

    return cursor
  }
}
