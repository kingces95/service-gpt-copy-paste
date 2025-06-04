// hello world
import { dispose } from './index.js'
import { AbortError } from '@kingjs/abort-error'
import { TimeoutError } from '@kingjs/timeout-error'
import { describe, it, expect, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

describe('dispose', () => {
  let options
  beforeEach(() => {
    options = { }
  })
  it('should be a function.', () => {
    expect(dispose).toBeInstanceOf(Function)
  })
  describe('of an resource', () => {
    describe('which is undefined', () => {
      it('should be a noop.', async () => {
        await dispose(undefined, options)
      })
      it('should be idempotent.', async () => {
        await dispose(undefined, options)
        await dispose(undefined, options)
      })
    })
    let resource
    describe('which disposes synchronously', () => {
      beforeEach(() => {
        options.disposeFn = o => o.disposed++
        resource = { disposed: 0 }
      })
      it('should call the dispose function.', async () => {
        await dispose(resource, options)
        await expect(resource.disposed).toBe(1)
      })
      describe('with a disposed predicate', () => {
        beforeEach(() => {
          options.disposedFn = o => o.disposed
        })
        it('should test if disposed before calling dispose.', async () => {
          await dispose(resource, options)
          await expect(resource.disposed).toBe(1)
          await dispose(resource, options)
          await expect(resource.disposed).toBe(1)
        })
      })
    })
    describe('which disposes asynchronously', () => {
      beforeEach(() => {
        resource = new EventEmitter()
        resource.disposed = 0
        resource.on('close', () => resource.disposed++)
      })
      describe('by raising a close event', () => {
        beforeEach(() => {
          options.disposeFn = o => o.emit('close')
          options.event = 'close'
        })
        it('should call the dispose function.', async () => {
          await dispose(resource, options)
          await expect(resource.disposed).toBe(1)
        })
        describe('with a disposed predicate', () => {
          beforeEach(() => {
            options.disposedFn = o => o.disposed
          })
          it('should test if disposed before calling dispose.', async () => {
            await dispose(resource, options)
            await expect(resource.disposed).toBe(1)
            await dispose(resource, options)
            await expect(resource.disposed).toBe(1)
          })
        })
      })
      describe('by raising an error', () => {
        const errorMessage = 'test error'
        beforeEach(() => {
          options.disposeFn = o => o.emit('error', new Error(errorMessage))
          options.event = 'error'
        })
        it('should throw an error.', async () => {
          await expect(dispose(resource, options)).rejects.toThrow(errorMessage)
          await expect(resource.disposed).toBe(0)
        })
      })
      describe('by timing out', () => {
        beforeEach(() => {
          options.event = 'close'
          options.timeoutMs = 1
        })
        it('should throw a TimeoutError.', async () => {
          await expect(dispose(resource, options)).rejects.toThrow(TimeoutError)
          await expect(resource.disposed).toBe(0)
        })
      })
      describe('by raising an abort signal', () => {
        let abortController
        beforeEach(() => {
          options.event = 'close'
          
          // raise the signal in next tick
          abortController = new AbortController()
          const signal = abortController.signal
          setTimeout(() => abortController.abort(), 0)
          
          options.signal = signal
        })
        describe('after dispose is called', () => {
          it('should throw an AbortError.', async () => {
            await expect(dispose(resource, options)).rejects.toThrow(AbortError)
            await expect(resource.disposed).toBe(0)
          })
        })
        describe('before dispose is called', () => {
          it('should throw an AbortError.', async () => {
            await expect(dispose(resource, options)).rejects.toThrow(AbortError)
            await expect(resource.disposed).toBe(0)
            await expect(dispose(resource, options)).rejects.toThrow(AbortError)
            await expect(resource.disposed).toBe(0)
          })
        })
      })
    })
  })
})
