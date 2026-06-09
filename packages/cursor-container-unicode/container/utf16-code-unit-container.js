import {
  Utf16ByteOrderMarks,
} from '@kingjs/unicode'
import { genericType } from '@kingjs/generic'
import {
  CodeUnitContainerOf,
} from './code-unit-container.js'
import { ByteOrderedContainerOf } from './byte-ordered-container.js'
import { assert } from '@kingjs/assert'

export const Utf16CodeUnitContainerOf = genericType(TSpan => {
  const CodeUnitContainer = CodeUnitContainerOf(TSpan)
  const ByteOrderedContainer = ByteOrderedContainerOf(TSpan)

  return class Utf16CodeUnitContainer extends CodeUnitContainer {
    constructor({ source = null, byteOrder = null } = { }) {
      source ??= new ByteOrderedContainer({
        byteOrder: byteOrder ?? Utf16ByteOrderMarks,
        byteWidth: 2,
      })

      assert(source instanceof ByteOrderedContainer,
        'UTF-16 code unit source must be a byte ordered container.')

      super({ source })
    }
  }
})

export const Utf16CodeUnitContainer = Utf16CodeUnitContainerOf(Object)
