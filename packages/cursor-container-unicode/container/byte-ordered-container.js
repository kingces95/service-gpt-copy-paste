import { assert } from '@kingjs/assert'
import { Lazy } from '@kingjs/lazy'
import { compose } from '@kingjs/partial-compose'
import { Uint8 } from '@kingjs/simple-type'
import {
  FixedStrideRangeContainer,
  ProjectedRangePart,
  ProjectedRangeContainer,
  RangeContainer,
  SplitContainerPart,
} from '@kingjs/cursor-container-ranges'
import {
  assertByteOrder,
  decodeBytes,
} from '@kingjs/unicode'
import { ByteOrderedPart } from '../part/byte-ordered-part.js'

export function lazyByteOrderOf(byteOrder) {
  if (byteOrder instanceof Lazy)
    return byteOrder

  return new Lazy(() => {
    assertByteOrder(byteOrder)
    return byteOrder
  })
}

function byteAt(cursor) {
  const value = cursor.value
  assert(value instanceof Uint8,
    'Expected source value to be Uint8.')

  return value
}

const projectedSplit = ProjectedRangeContainer.prototype.split

export class ByteOrderedContainer extends FixedStrideRangeContainer {
  _lazyByteOrder
  _byteWidth

  constructor({ byteOrder, byteWidth }) {
    assert(byteWidth > 1,
      'Byte width must be greater than one.')

    super(new RangeContainer(), { fixedStride: byteWidth })
    this._lazyByteOrder = lazyByteOrderOf(byteOrder)
    this._byteWidth = byteWidth
  }

  static {
    compose(this, ByteOrderedPart, {
      get lazyByteOrder() { return this._lazyByteOrder },
      get byteWidth() { return this._byteWidth },
      get byteOrder() { return this.lazyByteOrder.value },
    })

    compose(this, SplitContainerPart, {
      split(cursor = this.end(), result = null) {
        result ??= new this.constructor({
          byteOrder: this.lazyByteOrder,
          byteWidth: this.byteWidth,
        })

        return projectedSplit.call(this, cursor, result)
      },
    })

    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor, stride) {
        const bytes = []

        for (let i = 0; i < stride; i++) {
          bytes.push(byteAt(sourceCursor))
          sourceCursor.step()
        }

        return decodeBytes(bytes, this.byteOrder)
      },
    })
  }
}
