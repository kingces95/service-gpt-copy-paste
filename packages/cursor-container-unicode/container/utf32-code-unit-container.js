import {
  Utf32ByteOrderMarks,
} from '@kingjs/unicode'
import {
  CodeUnitContainer,
} from './code-unit-container.js'
import { ByteOrderedContainer } from './byte-ordered-container.js'
import { assert } from '@kingjs/assert'

export class Utf32CodeUnitContainer extends CodeUnitContainer {
  constructor({ source = null, byteOrder = null } = { }) {
    source ??= new ByteOrderedContainer({
      byteOrder: byteOrder ?? Utf32ByteOrderMarks,
      byteWidth: 4,
    })

    assert(source instanceof ByteOrderedContainer,
      'UTF-32 code unit source must be a byte ordered container.')

    super({ source })
  }
}
