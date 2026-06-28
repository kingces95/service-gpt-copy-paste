import {
  Utf32ByteOrderMarks,
} from '@kingjs/unicode'
import { compose } from '@kingjs/partial-compose'
import { ByteOrderedContainer } from './byte-ordered-container.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

const toStrings = ByteOrderedContainer.prototype.toStrings

export class Utf32CodeUnitContainer extends ByteOrderedContainer {
  constructor({ byteOrder = null } = { }) {
    super({
      byteOrder: byteOrder ?? Utf32ByteOrderMarks,
      byteWidth: 4,
    })
  }

  static {
    compose(this, StringMaterializationPart, {
      toStrings() { return toStrings.call(this, 'utf-32') },
    })
  }
}

export class Utf32BECodeUnitContainer extends Utf32CodeUnitContainer {
  constructor() {
    super({ byteOrder: 'big' })
  }
}

export class Utf32LECodeUnitContainer extends Utf32CodeUnitContainer {
  constructor() {
    super({ byteOrder: 'little' })
  }
}
