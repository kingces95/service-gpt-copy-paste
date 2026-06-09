import { assert } from '@kingjs/assert'
import {
  FixedStrideRangeContainer,
} from '@kingjs/cursor-container-ranges'
import { ByteOrderedContainer } from './byte-ordered-container.js'

export class CodeUnitContainer extends FixedStrideRangeContainer {
  constructor({ source }) {
    assert(source instanceof ByteOrderedContainer,
      'Code unit source must be a byte ordered container.')
    super(source)
  }
}
