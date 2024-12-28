import { describe, test, expect } from 'vitest'
import { Subject } from 'rxjs'
import MockOperation from './mock-operation'
import fromStreamController from '@kingjs/rx-from-stream-controller'

describe('fromStreamController', () => {
  test('should merge streams and events for a typical controller (e.g. spawn)', async () => {
    const mockObservable = new Subject()

    const mockOp = new MockOperation({
      streamNames: ['stdout', 'stderr'],
      observable: mockObservable,
    })

    const observable = fromStreamController(mockOp, {
      streams: ['stdout', 'stderr'],
      events: ['customEvent'],
      completeEvent: 'close',
    })

    const results = []
    await new Promise((resolve, reject) => {
      observable.subscribe({
        next: (value) => results.push(value),
        error: (err) => reject(err),
        complete: resolve
      })

      // Simulate stream and event emissions
      mockObservable.next({ stream: 'stdout', data: 'stdout chunk1' })
      mockObservable.next({ stream: 'stdout', data: 'stdout chunk2' })
      mockObservable.next({ stream: 'stderr', data: 'stderr chunk1' })
      mockObservable.next({ event: 'customEvent', data: 'event data' })
      mockObservable.next({ event: 'close' })
      mockObservable.next({ stream: 'stderr', event: 'end' })
      mockObservable.next({ stream: 'stdout', event: 'end' })
    })

    expect(results).toEqual([
      { stream: 'stdout', data: 'stdout chunk1' },
      { stream: 'stdout', data: 'stdout chunk2' },
      { stream: 'stderr', data: 'stderr chunk1' },
      { event: 'customEvent', data: 'event data' },
    ])
  })

  test('can drain streams async of the controller closing', async () => {
    const mockObservable = new Subject()

    const mockOp = new MockOperation({
      streamNames: ['stdout'],
      observable: mockObservable,
    })

    const observable = fromStreamController(mockOp, {
      streams: ['stdout'],
      events: ['customEvent'],
      completeEvent: 'close',
    })

    const results = []
    await new Promise((resolve, reject) => {
      observable.subscribe({
        next: (value) => results.push(value),
        error: (err) => reject(err),
        complete: resolve
      })

      // Simulate stream and event emissions
      mockObservable.next({ event: 'customEvent', data: 'event data' })
      mockObservable.next({ event: 'close' })
      mockObservable.next({ stream: 'stdout', data: 'stdout chunk1' })
      mockObservable.next({ stream: 'stdout', event: 'end' })
    })

    expect(results).toEqual([
      { event: 'customEvent', data: 'event data' },
      { stream: 'stdout', data: 'stdout chunk1' },
    ])
  })

  test('will report irrecoverable stream errors', async () => {
    const mockObservable = new Subject()

    const mockOp = new MockOperation({
      streamNames: ['stdout'],
      observable: mockObservable,
    })

    const observable = fromStreamController(mockOp, {
      streams: ['stdout'],
    })

    const results = []
    await new Promise((resolve, reject) => {
      observable.subscribe({
        next: (value) => results.push(value),
        error: (err) => reject(err),
        complete: resolve
      })

      // Simulate stream and event emissions
      mockObservable.next({ stream: 'stdout', data: 'stdout chunk1' })
      mockObservable.next({ stream: 'stdout', event: 'error', data: 'stdout error' })
    })

    expect(results).toEqual([
      { stream: 'stdout', data: 'stdout chunk1' },
      { stream: 'stdout', event: 'error', data: 'stdout error' },
    ])
  })

  test('should need no complete event if there are no custom events (e.g. axios)', async () => {
    const mockObservable = new Subject()

    const mockOp = new MockOperation({
      streamNames: ['data'],
      observable: mockObservable,
    })

    const observable = fromStreamController(mockOp, {
      streams: ['data'],
    })

    const results = []
    await new Promise((resolve, reject) => {
      observable.subscribe({
        next: (value) => results.push(value),
        error: (err) => reject(err),
        complete: resolve
      })

      // Simulate stream and event emissions
      mockObservable.next({ stream: 'data', data: 'data chunk1' })
      mockObservable.next({ stream: 'data', data: 'data chunk2' })
      mockObservable.next({ stream: 'data', event: 'end' })
    })

    expect(results).toEqual([
      { stream: 'data', data: 'data chunk1' },
      { stream: 'data', data: 'data chunk2' },
    ])
  })

  test('should throw an error if a stream is missing from the controller', async () => {
    const mockObservable = new Subject()

    const mockOp = new MockOperation({
      streamNames: ['stdout'],
      observable: mockObservable,
    })
    
    expect(() => {
      fromStreamController(mockOp, {
        streams: ['stdout', 'stderr'], // stderr is missing
        events: ['customEvent'],
        completeEvent: 'close',
      })
    }).toThrowError("Stream 'stderr' not found on the controller.")
  })
})
