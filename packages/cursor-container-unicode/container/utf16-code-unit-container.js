import {
  Utf16ByteOrderMarks,
} from '@kingjs/unicode'
import { compose } from '@kingjs/partial-compose'
import { CodeUnitContainer } from './code-unit-container.js'
import { ByteOrderedContainer } from './byte-ordered-container.js'
import { assert } from '@kingjs/assert'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

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

  static {
    compose(this, StringMaterializationPart, {
      toStrings() { return this.source$.toStrings('utf-16') },
    })
  }
}
