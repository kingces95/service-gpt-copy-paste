import {
  define,
} from '@kingjs/partial-define'
import {
  FixedProjectedRangeContainer,
  RangeContainer,
} from '@kingjs/cursor-container-ranges'

export class CodeUnitContainer extends FixedProjectedRangeContainer {
  constructor() {
    super(new RangeContainer(), { fixedStride: 1 })
  }

  static {
    define(this, {
      decodeToken$(sourceCursor) {
        return sourceCursor.value
      },
    })
  }
}
