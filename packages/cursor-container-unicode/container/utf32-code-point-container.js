import {
  ProjectedRangeContainer,
  ProjectedRangeContainerPart,
} from '@kingjs/cursor-virtual'
import { compose } from '@kingjs/partial-compose'
import {
  assertScalarValue,
} from '@kingjs/unicode'
import {
  Utf32BECodeUnitContainer,
  Utf32LECodeUnitContainer,
} from './code-unit-container.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

export class Utf32CodePointContainer extends ProjectedRangeContainer {
  constructor(source) {
    super(source)
  }

  static {
    compose(this, StringMaterializationPart, {
      toStrings() { return this.source$.toStrings() },
    })

    compose(this, ProjectedRangeContainerPart, {
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
    super(new Utf32BECodeUnitContainer())
  }
}

export class Utf32LECodePointContainer extends Utf32CodePointContainer {
  constructor() {
    super(new Utf32LECodeUnitContainer())
  }
}
