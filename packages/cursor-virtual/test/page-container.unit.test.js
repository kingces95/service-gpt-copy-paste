import { describe, expect, it } from 'vitest'
import { TypedArrayView } from '@kingjs/cursor-view'
import {
  Page,
  VirtualContainer,
} from '../index.js'

describe('Page', () => {
  it('exposes virtual cursors when attached to a virtual container', () => {
    const container = new VirtualContainer()
    container.pushRange(new TypedArrayView(Uint8Array.from([1, 2, 3])))

    const page = container.begin().storedPage

    expect(page.begin().equals(container.begin())).toBe(true)
    expect(page.end().equals(container.end())).toBe(true)
    expect(page.findSequence(Uint8Array.from([2])).begin.value).toBe(2)
  })
})
