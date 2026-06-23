import {
  FixedStrideProjectedRangeContainer,
  ProjectedRangePart,
} from '@kingjs/cursor-virtual'
import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import {
  assertScalarValue,
} from '@kingjs/unicode'
import {
  Utf32BECodeUnitContainer,
  Utf32CodeUnitContainer,
  Utf32LECodeUnitContainer,
} from './utf32-code-unit-container.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

export class Utf32CodePointContainer extends FixedStrideProjectedRangeContainer {
  constructor({ source = null, byteOrder = null } = { }) {
    source ??= new Utf32CodeUnitContainer({ byteOrder })
    assert(source instanceof Utf32CodeUnitContainer,
      'UTF-32 code point source must be a UTF-32 code unit container.')

    super(source)
  }

  static {
    compose(this, StringMaterializationPart, {
      toStrings() { return this.source$.toStrings('utf-32') },
    })

    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor) {
        const value = sourceCursor.value
        assertScalarValue(value)
        return value
      },
    })
  }
}

export class Utf32BECodePointContainer extends Utf32CodePointContainer {
  constructor({ source = null } = { }) {
    source ??= new Utf32BECodeUnitContainer()
    assert(source instanceof Utf32BECodeUnitContainer,
      'UTF-32BE code point source must be a UTF-32BE code unit container.')
    super({ source })
  }
}

export class Utf32LECodePointContainer extends Utf32CodePointContainer {
  constructor({ source = null } = { }) {
    source ??= new Utf32LECodeUnitContainer()
    assert(source instanceof Utf32LECodeUnitContainer,
      'UTF-32LE code point source must be a UTF-32LE code unit container.')
    super({ source })
  }
}
