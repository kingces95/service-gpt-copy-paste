import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { iterate } from '@kingjs/cursor-algorithm'
import { genericType } from '@kingjs/generic'
import { Uint8 } from '@kingjs/simple-type'
import {
  FixedStrideVirtualContainerOf,
  CloneEmptyPart,
  VirtualPart,
  RangeOfRangesPartOf,
  RangeContainerOf,
} from '@kingjs/cursor-virtual'
import {
  assertByteOrder,
  decodeBytes,
  NativeByteOrder,
} from '@kingjs/unicode'
import { PreambleScanner } from '../preamble-scanner.js'
import {
  byteOrderedEncodingOf,
  byteRangesToStringsOf,
} from '../source-ranges-to-string.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

function byteAt(cursor) {
  const value = cursor.value
  assert(value instanceof Uint8,
    'Expected source value to be Uint8.')

  return value
}

function isByteOrder(value) {
  return value == 'big' || value == 'little'
}

export const ByteOrderedContainerOf = genericType(TSpan => {
  const FixedStrideVirtualContainer = FixedStrideVirtualContainerOf(TSpan)
  const RangeOfRangesPart = RangeOfRangesPartOf(TSpan)
  const RangeContainer = RangeContainerOf(TSpan)
  const pushRange = FixedStrideVirtualContainer.prototype.pushRange
  const byteRangesToStrings = byteRangesToStringsOf(TSpan)

  return class ByteOrderedContainer extends FixedStrideVirtualContainer {
    _byteOrder
    _byteWidth
    _preamble

    constructor({ source = null, byteOrder = null, byteWidth }) {
      assert(byteWidth > 1,
        'Byte width must be greater than one.')
      assert(byteOrder == null || isByteOrder(byteOrder) ||
        typeof byteOrder == 'object',
        'Byte order must be null, big, little, or preambles.')

      source ??= new RangeContainer()
      assert(source instanceof RangeContainer,
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

            for (const range of iterate(remainder.ranges()))
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
          return byteRangesToStrings(this.ranges(), encodingOf)
        },
      })

      compose(this, RangeOfRangesPart, {
        pushRange(range) {
          if (this._preamble)
            this._preamble.pushRange(range)
          else
            pushRange.call(this, range)

          return this
        },
      })

      compose(this, CloneEmptyPart, {
        cloneEmpty() {
          return new this.constructor({
            source: this.source$.cloneEmpty(),
            byteOrder: this._byteOrder,
            byteWidth: this._byteWidth,
          })
        },
      })

      compose(this, VirtualPart, {
        decodeToken$(sourceCursor, stride) {
          assert(this._byteOrder != null,
            'Byte order has not been resolved.')

          const bytes = []

          for (let i = 0; i < stride; i++) {
            bytes.push(byteAt(sourceCursor))
            sourceCursor.step()
          }

          return decodeBytes(bytes, this._byteOrder)
        },
      })
    }
  }
})

export const ByteOrderedContainer = ByteOrderedContainerOf(Object)
