import { assert } from '@kingjs/assert'
import {
  FixedStrideProjectedRangeContainer,
} from '@kingjs/cursor-virtual'
import { ByteOrderedContainer } from './byte-ordered-container.js'

export class CodeUnitContainer extends FixedStrideProjectedRangeContainer {
  constructor({ source }) {
    assert(source instanceof ByteOrderedContainer,
      'Code unit source must be a byte ordered container.')
    super(source)
  }
}
