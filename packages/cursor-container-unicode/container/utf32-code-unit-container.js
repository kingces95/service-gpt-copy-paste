import {
  Utf32ByteOrderMarks,
} from '@kingjs/unicode'
import { compose } from '@kingjs/partial-compose'
import { CodeUnitContainer } from './code-unit-container.js'
import { ByteOrderedContainer } from './byte-ordered-container.js'
import { assert } from '@kingjs/assert'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

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

  static {
    compose(this, StringMaterializationPart, {
      toStrings() { return this.source$.toStrings('utf-32') },
    })
  }
}

export class Utf32BECodeUnitContainer extends Utf32CodeUnitContainer {
  constructor({ source = null } = { }) {
    super({ source, byteOrder: 'big' })
  }
}

export class Utf32LECodeUnitContainer extends Utf32CodeUnitContainer {
  constructor({ source = null } = { }) {
    super({ source, byteOrder: 'little' })
  }
}
