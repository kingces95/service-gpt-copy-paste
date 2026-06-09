import {
  Utf16ByteOrderMarks,
} from '@kingjs/unicode'
import {
  CodeUnitContainer,
} from './code-unit-container.js'
import { ByteOrderedContainer } from './byte-ordered-container.js'
import { assert } from '@kingjs/assert'

export class Utf16CodeUnitContainer extends CodeUnitContainer {
  constructor({ source = null, byteOrder = null } = { }) {
    source ??= new ByteOrderedContainer({
      byteOrder: byteOrder ?? Utf16ByteOrderMarks,
      byteWidth: 2,
    })

    assert(source instanceof ByteOrderedContainer,
      'UTF-16 code unit source must be a byte ordered container.')

    super({ source })
  }
}
