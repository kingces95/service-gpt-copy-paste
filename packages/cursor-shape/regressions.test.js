import { describe, it, expect } from 'vitest'
import { implement } from '@kingjs/partial-implement'
import {
  OutputCursorShape,
} from '@kingjs/cursor-shape'
import {
  WritableCursorConcept,
} from '@kingjs/cursor'

describe('cursor shape regressions', () => {
  it('preserves inherited accessor halves when copying the other half', () => {
    class Base { }

    Object.defineProperty(Base.prototype, 'value', {
      get() { },
      configurable: true,
    })

    class MyCursor extends Base { }

    implement(MyCursor, WritableCursorConcept, {
      set value(value) { },
    })

    const descriptor = Object.getOwnPropertyDescriptor(
      MyCursor.prototype, 'value')

    expect(descriptor.get).toBeDefined()
    expect(descriptor.set).toBeDefined()

    const cursor = new MyCursor()
    expect(cursor).toBeInstanceOf(OutputCursorShape)
  })
})
