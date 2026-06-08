import {
  DefinesAbstract,
  PartialClass,
} from '@kingjs/partial-class'
import { compose } from '@kingjs/partial-compose'
import { ProjectedRangePart } from '@kingjs/cursor-container-ranges'

export class ByteOrderedPart extends PartialClass {
  static [DefinesAbstract] = {
    get lazyByteOrder() { },
    get byteWidth() { },
  }

  get byteOrder() { return this.lazyByteOrder.value }
}

export class ByteOrderAwarePart extends ProjectedRangePart {
  static {
    compose(this, ByteOrderedPart, {
      get lazyByteOrder() { return this.source$.lazyByteOrder },
      get byteWidth() { return this.source$.byteWidth },
    })
  }
}
