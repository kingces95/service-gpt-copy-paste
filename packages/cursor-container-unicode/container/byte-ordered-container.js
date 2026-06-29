import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { Uint8 } from '@kingjs/simple-type'
import {
  ProjectedRangeContainer,
  ProjectedRangePart,
  VirtualContainer,
} from '@kingjs/cursor-virtual'
import { advance, previous, retreat } from '@kingjs/cursor-algorithm'
import {
  decodeBytes,
  utfEncodingOfByteWidth,
} from '@kingjs/unicode'
import {
  byteOrderedEncodingOf,
  byteSpansToStrings,
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

export class ByteOrderedContainer extends ProjectedRangeContainer {
  _byteOrder
  _byteWidth

  constructor({ byteOrder, byteWidth }) {
    assert(byteWidth > 1,
      'Byte width must be greater than one.')
    assert(isByteOrder(byteOrder),
      'Byte order must be big or little.')

    super(new VirtualContainer())
    this._byteWidth = byteWidth
    this._byteOrder = byteOrder
  }

  static {
    compose(this, StringMaterializationPart, {
      toStrings(encoding) {
        encoding ??= utfEncodingOfByteWidth(this._byteWidth)
        encoding = byteOrderedEncodingOf(encoding, this._byteOrder)
        return byteSpansToStrings(this.spans(), encoding)
      },
    })

    compose(this, ProjectedRangePart, {
      trimEnd$(sourceCursor) {
        return previous(sourceCursor, this.bytesPushed % this._byteWidth)
      },

      stepValue$(sourceCursor) {
        advance(sourceCursor, this._byteWidth)
      },

      stepBackValue$(sourceCursor) {
        retreat(sourceCursor, this._byteWidth)
      },

      decodeValue$(sourceCursor) {
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
