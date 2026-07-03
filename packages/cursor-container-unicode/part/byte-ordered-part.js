import { assert } from '@kingjs/assert'
import {
  Fields,
  Initializer,
  PartialClass,
  Self,
} from '@kingjs/partial-class'
import { override } from '@kingjs/partial-override'
import { Uint8 } from '@kingjs/simple-type'
import {
  ProjectedRangeContainerPart,
} from '@kingjs/cursor-virtual'
import { advance, previous, retreat } from '@kingjs/cursor-algorithm'
import {
  decodeBytes,
} from '@kingjs/unicode'

const ByteOrder = Symbol('ByteOrderedPart.ByteOrder')
const ByteWidth = Symbol('ByteOrderedPart.ByteWidth')

function byteAt(cursor) {
  const value = cursor.value
  assert(value instanceof Uint8,
    'Expected source value to be Uint8.')

  return value
}

function isByteOrder(value) {
  return value == 'big' || value == 'little'
}

export class ByteOrderedPart extends PartialClass {
  static [Self] = [
    ProjectedRangeContainerPart,
  ]

  static [Fields] = {
    [ByteOrder]: undefined,
    [ByteWidth]: undefined,
  }

  static [Initializer](byteOrder, byteWidth) {
    assert(byteWidth > 1,
      'Byte width must be greater than one.')
    assert(isByteOrder(byteOrder),
      'Byte order must be big or little.')

    this[ByteWidth] = byteWidth
    this[ByteOrder] = byteOrder
  }

  static {
    override(this, ProjectedRangeContainerPart, {
      trimEnd$(sourceCursor) {
        const prp = this
        return previous(sourceCursor, prp.bytesPushed % this[ByteWidth])
      },

      stepValue$(sourceCursor) {
        advance(sourceCursor, this[ByteWidth])
      },

      stepBackValue$(sourceCursor) {
        retreat(sourceCursor, this[ByteWidth])
      },

      decodeValue$(sourceCursor) {
        const bytes = []

        for (let i = 0; i < this[ByteWidth]; i++) {
          bytes.push(byteAt(sourceCursor))
          sourceCursor.step()
        }

        return decodeBytes(bytes, this[ByteOrder])
      },
    })
  }
}
