import { describe, it, beforeEach, expect, vi } from 'vitest'
vi.mock('@kingjs/dispose', () => ({ dispose: vi.fn() }))

import { Disposer } from './index.js'
import { dispose as mockDispose } from '@kingjs/dispose'

describe('Disposer', () => {
  const disposeFn = () => {}
  const disposedFn = () => false
  const event = 'close'

  let disposer
  beforeEach(() => {
    disposer = new Disposer(disposeFn, { disposedFn, event })
  })
  
  it('should have disposeFn', () => {
    expect(disposer.disposeFn).toBe(disposeFn)
  })
  it('should have disposedFn', () => {
    expect(disposer.disposedFn).toBe(disposedFn)
  })
  it('should have event', () => {
    expect(disposer.event).toBe(event)
  })

  describe('with mocked dispose', () => {
    const resource = { }
    const signal = { aborted: false }
    const timeoutMs = 500
    const options = { signal, timeoutMs}
    const args = [resource, options]
    beforeEach(() => {
      mockDispose.mockClear()
    })

    it('calls dispose with correct parameters', async () => {
      await disposer.dispose(...args)
      expect(mockDispose)
        .toHaveBeenCalledTimes(1)
        .toHaveBeenCalledWith(resource, 
          expect.objectContaining({
            event, timeoutMs, disposeFn, disposedFn
          })
        )
    })
  
    it('propagates errors from dispose', async () => {
      mockDispose.mockImplementation(() => {
        throw new Error('fail')
      })
  
      const disposer = new Disposer(() => {})
      await expect(disposer.dispose(...args)).rejects.toThrow('fail')
    })
  })
})
