import { assert } from '@kingjs/assert'
import { genericType } from '@kingjs/generic'
import {
  FixedStrideRangeContainerOf,
} from '@kingjs/cursor-virtual'
import { ByteOrderedContainerOf } from './byte-ordered-container.js'

export const CodeUnitContainerOf = genericType(TSpan => {
  const FixedStrideRangeContainer = FixedStrideRangeContainerOf(TSpan)
  const ByteOrderedContainer = ByteOrderedContainerOf(TSpan)

  return class CodeUnitContainer extends FixedStrideRangeContainer {
    constructor({ source }) {
      assert(source instanceof ByteOrderedContainer,
        'Code unit source must be a byte ordered container.')
      super(source)
    }
  }
})

export const CodeUnitContainer = CodeUnitContainerOf(Object)
