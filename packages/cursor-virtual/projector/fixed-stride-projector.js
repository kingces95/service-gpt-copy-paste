import { distance, previous } from '@kingjs/cursor-algorithm'
import { subrange } from '@kingjs/cursor-view'
import { Projector } from './projector.js'

export class FixedStrideProjector extends Projector {
  _strideLength

  constructor(container, { strideLength }) {
    super(container)
    this._strideLength = strideLength
  }

  isSynchronized(sourceCursor) {
    return this.offsetOf(sourceCursor) % this._strideLength == 0
  }

  synchronize(sourceCursor) {
    const offset = this.offsetOf(sourceCursor)
    const remainder = offset % this._strideLength

    if (!remainder)
      return sourceCursor.clone()

    if (remainder > offset)
      return null

    return previous(sourceCursor, remainder)
  }

  offsetOf(sourceCursor) {
    return distance(subrange(this.container.source.begin(), sourceCursor))
  }
}
