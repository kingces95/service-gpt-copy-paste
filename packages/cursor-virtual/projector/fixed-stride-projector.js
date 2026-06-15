import { previous } from '@kingjs/cursor-algorithm'
import { Projector } from './projector.js'

export class FixedStrideProjector extends Projector {
  _strideLength

  constructor(container, { strideLength }) {
    super(container)
    this._strideLength = strideLength
  }

  isSynchronized(page, sourceCursor) {
    return (page.offset + page.offsetOf(sourceCursor)) %
      this._strideLength == 0
  }

  synchronize(page, sourceCursor) {
    const remainder = (page.offset + page.offsetOf(sourceCursor)) %
      this._strideLength

    if (!remainder)
      return sourceCursor.clone()

    if (remainder > page.offsetOf(sourceCursor))
      return null

    return previous(sourceCursor, remainder)
  }
}
