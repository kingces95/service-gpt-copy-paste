import {
  Utf32ByteOrderMarks,
} from '@kingjs/unicode'
import { genericType } from '@kingjs/generic'
import {
  CodeUnitContainerOf,
} from './code-unit-container.js'
import { ByteOrderedContainerOf } from './byte-ordered-container.js'
import { assert } from '@kingjs/assert'

export const Utf32CodeUnitContainerOf = genericType(TSpan => {
  const CodeUnitContainer = CodeUnitContainerOf(TSpan)
  const ByteOrderedContainer = ByteOrderedContainerOf(TSpan)

  return class Utf32CodeUnitContainer extends CodeUnitContainer {
    constructor({ source = null, byteOrder = null } = { }) {
      source ??= new ByteOrderedContainer({
        byteOrder: byteOrder ?? Utf32ByteOrderMarks,
        byteWidth: 4,
      })

      assert(source instanceof ByteOrderedContainer,
        'UTF-32 code unit source must be a byte ordered container.')

      super({ source })
    }
  }
})

export const Utf32CodeUnitContainer = Utf32CodeUnitContainerOf(Object)
