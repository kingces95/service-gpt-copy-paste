import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { Uint8 } from '@kingjs/simple-type'
import {
  FixedStrideProjectedRangeContainer,
  ProjectedRangePart,
  RangeContainerPart,
  SplittableRangePart,
  VirtualContainer,
} from '@kingjs/cursor-virtual'
import {
  decodeBytes,
  NativeByteOrder,
} from '@kingjs/unicode'
import { PreambleScanner } from '../preamble-scanner.js'
import {
  byteOrderedEncodingOf,
  byteSpansToStrings,
} from '../source-ranges-to-string.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

const pushRange = FixedStrideProjectedRangeContainer.prototype.pushRange

function byteAt(cursor) {
  const value = cursor.value
  assert(value instanceof Uint8,
    'Expected source value to be Uint8.')

  return value
}

function isByteOrder(value) {
  return value == 'big' || value == 'little'
}

export class ByteOrderedContainer extends FixedStrideProjectedRangeContainer {
  _byteOrder
  _byteWidth
  _preamble

  constructor({ source = null, byteOrder = null, byteWidth }) {
    assert(byteWidth > 1,
      'Byte width must be greater than one.')
    assert(byteOrder == null || isByteOrder(byteOrder) ||
      typeof byteOrder == 'object',
      'Byte order must be null, big, little, or preambles.')

    source ??= new VirtualContainer()
    assert(source instanceof VirtualContainer,
      'Byte ordered source must be a range container.')

    super(source, { strideLength: byteWidth })
    this._preamble = null
    this._byteWidth = byteWidth
    this._byteOrder = isByteOrder(byteOrder)
      ? byteOrder
      : byteOrder == null
        ? NativeByteOrder
        : null

    if (this._byteOrder == null) {
      assert(byteOrder.big.length == byteWidth &&
        byteOrder.little.length == byteWidth,
        'Byte order mark length must match byte width.')
      this._preamble = new PreambleScanner({
        sequences: byteOrder,
        onPreamble: ({ match, remainder }) => {
          this._byteOrder = match ?? NativeByteOrder
          this._preamble = null

          for (const range of remainder.ranges())
            pushRange.call(this, range)
        },
      })
    }
  }

  static {
    compose(this, StringMaterializationPart, {
      toStrings(encoding) {
        if (this._byteOrder == null)
          return []

        const encodingOf = () =>
          byteOrderedEncodingOf(encoding, this._byteOrder)
        return byteSpansToStrings(this.spans(), encodingOf)
      },
    })

    compose(this, RangeContainerPart, {
      pushRange(range) {
        if (this._preamble)
          this._preamble.pushRange(range)
        else
          pushRange.call(this, range)

        return this
      },
    })

    compose(this, SplittableRangePart)

    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor) {
        assert(this._byteOrder != null,
          'Byte order has not been resolved.')

        const bytes = []

        for (let i = 0; i < this._byteWidth; i++) {
          bytes.push(byteAt(sourceCursor))
          sourceCursor.step()
        }

        return decodeBytes(bytes, this._byteOrder)
      },
    })
  }
}
