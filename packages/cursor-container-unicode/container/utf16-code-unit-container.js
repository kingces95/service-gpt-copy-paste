import {
  Utf16ByteOrderMarks,
} from '@kingjs/unicode'
import { compose } from '@kingjs/partial-compose'
import { ByteOrderedContainer } from './byte-ordered-container.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

const toStrings = ByteOrderedContainer.prototype.toStrings

export class Utf16CodeUnitContainer extends ByteOrderedContainer {
  constructor({ byteOrder = null } = { }) {
    super({
      byteOrder: byteOrder ?? Utf16ByteOrderMarks,
      byteWidth: 2,
    })
  }

  static {
    compose(this, StringMaterializationPart, {
      toStrings() { return toStrings.call(this, 'utf-16') },
    })
  }
}

export class Utf16BECodeUnitContainer extends Utf16CodeUnitContainer {
  constructor() {
    super({ byteOrder: 'big' })
  }
}

export class Utf16LECodeUnitContainer extends Utf16CodeUnitContainer {
  constructor() {
    super({ byteOrder: 'little' })
  }
}
