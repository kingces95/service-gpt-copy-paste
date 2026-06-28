import {
  ProjectedRangeContainer,
  ProjectedRangePart,
} from '@kingjs/cursor-virtual'
import { compose } from '@kingjs/partial-compose'
import {
  assertScalarValue,
} from '@kingjs/unicode'
import {
  Utf32CodeUnitContainer,
} from './utf32-code-unit-container.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

export class Utf32CodePointContainer extends ProjectedRangeContainer {
  constructor({ byteOrder = null } = { }) {
    super(new Utf32CodeUnitContainer({ byteOrder }))
  }

  static {
    compose(this, StringMaterializationPart, {
      toStrings() { return this.source$.toStrings('utf-32') },
    })

    compose(this, ProjectedRangePart, {
      decodeValue$(sourceCursor) {
        const value = sourceCursor.value
        assertScalarValue(value)
        return value
      },
    })
  }
}

export class Utf32BECodePointContainer extends Utf32CodePointContainer {
  constructor() {
    super({ byteOrder: 'big' })
  }
}

export class Utf32LECodePointContainer extends Utf32CodePointContainer {
  constructor() {
    super({ byteOrder: 'little' })
  }
}
