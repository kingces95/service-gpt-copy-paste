import { describe, it, beforeEach, expect, vi } from 'vitest'
import { Resource } from './index.js'
import { Disposer } from '@kingjs/disposer'
import { dispose as mockDispose } from '@kingjs/dispose'

vi.mock('@kingjs/dispose', () => ({ dispose: vi.fn() }))

describe('Resource', () => {
  const value = {}
  const valueFn = () => value
  const disposeFn = () => {}
  const disposedFn = () => false
  const event = 'close'
  const disposer = new Disposer(disposeFn, { disposedFn, event })

  let resource
  describe('with mocked dispose', () => {
    const signal = { aborted: false }
    const timeoutMs = 500
    const options = { signal, timeoutMs }
    const disposeArgs = [options]
    beforeEach(() => {
      mockDispose.mockClear()
    })
    describe('which is an owner', () => {
      beforeEach(() => {
        resource = new Resource(valueFn, disposer)
      })
      it('should be an owner', () => {
        expect(resource.isOwned).toBe(true)
      })
      it('should report being unactivated', () => {
        expect(resource.isUnactivated).toBe(true)
        expect(resource.state).toBe(Resource.Unactivated)
      })
      describe('when disposed before activation', () => {
        it('should be disposed', async () => {
          await resource.dispose()
          expect(resource.isDisposed).toBe(true)
          expect(resource.state).toBe(Resource.Disposed)
        })
        it('should not call dispose', async () => {
          await resource.dispose(...disposeArgs)
          expect(mockDispose).not.toHaveBeenCalled()
        })
      })
      describe('when activated', () => {
        beforeEach(() => {
          resource.value // activates
        })
        it('should report being activated', () => {
          expect(resource.isActivated).toBe(true)
          expect(resource.state).toBe(Resource.Activated)
        })
        it('should have a value', () => {
          expect(resource.value).toBe(value)
        })
        describe('when disposed', () => {
          it('should be disposed', async () => {
            await resource.dispose()
            expect(resource.isDisposed).toBe(true)
            expect(resource.state).toBe(Resource.Disposed)
          })
          it('should call dispose with correct parameters', async () => {
            await resource.dispose(...disposeArgs)
            expect(mockDispose)
              .toHaveBeenCalledTimes(1)
              .toHaveBeenCalledWith(value, 
                expect.objectContaining({
                  event, timeoutMs, disposeFn, disposedFn
                })
              )
          })
          it('should propagate errors from dispose', async () => {
            mockDispose.mockImplementation(() => { throw new Error('fail') })
            await expect(resource.dispose(...disposeArgs))
              .rejects.toThrow('fail')
          })
        })
      })
    })
    describe('which is not an owner', () => {
      beforeEach(() => {
        resource = new Resource(valueFn, disposer, { end: false })
      })
      it('should not be an owner', () => {
        expect(resource.isOwned).toBe(false)
      })
      describe('when activated', () => {
        beforeEach(() => {
          resource.value // activates
        })
        it('should report being activated', () => {
          expect(resource.isActivated).toBe(true)
          expect(resource.state).toBe(Resource.Activated)
        })
        it('should have a value', () => {
          expect(resource.value).toBe(value)
        })
        describe('when disposed', () => {
          it('should be disposed', async () => {
            await resource.dispose()
            expect(resource.isDisposed).toBe(true)
            expect(resource.state).toBe(Resource.Disposed)
          })
          it('should not call dispose', async () => {
            await resource.dispose(...disposeArgs)
            expect(mockDispose).not.toHaveBeenCalled()
          })
        })
      })
    })
  })
})
