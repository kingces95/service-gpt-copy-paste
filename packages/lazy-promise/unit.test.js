import { describe, expect, it } from 'vitest'
import { LazyPromise } from './index.js'

describe('LazyPromise', () => {
  it('runs the loader once for concurrent awaits', async () => {
    let count = 0
    const lazy = new LazyPromise(async () => ++count)

    const [first, second] = await Promise.all([lazy, lazy])

    expect(first).toBe(1)
    expect(second).toBe(1)
    expect(count).toBe(1)
  })

  it('caches falsey values', async () => {
    let count = 0
    const lazy = new LazyPromise(async () => {
      count++
      return null
    })

    expect(await lazy).toBe(null)
    expect(await lazy).toBe(null)
    expect(count).toBe(1)
  })
})
