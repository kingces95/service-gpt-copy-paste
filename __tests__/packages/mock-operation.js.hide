import { EventEmitter } from 'events'
import { PassThrough } from 'stream'

/**
 * A full-blown mock operation that mimics the behavior of a dual-pipe process.
 * The mock operation extends EventEmitter and exposes named streams and events.
 * It takes an observable to control events and streams.
 */
class MockOperation extends EventEmitter {
  constructor(config = {}) {
    super()

    const { streamNames = [], observable } = config

    if (!observable) {
      throw new Error('An observable must be provided to control the mock operation.')
    }

    // Create streams for the provided names
    for (const name of streamNames) {
      this[name] = new PassThrough({ objectMode: true })
    }

    // Subscribe to the observable to dispatch events and streams
    observable.subscribe({
      next: (message) => {
        const { stream, event, data } = message

        if (stream && this[stream]) {
          if (event === 'end') {
            this[stream].end()
          } else if (event === 'error') {
            this[stream].emit('error', data)
          } else {
            this[stream].write(data)
          }
        } else if (event) {
          this. emit(event, data)
        }        
      },
      error: (err) => console.error('MockOperation internal error:', err),
    })
  }
}

export default MockOperation

// Example usage:
// const mockObservable = new Subject()

// const mockOp = new MockOperation({
//   streamNames: ['stdout', 'stderr'],
//   observable: mockObservable,
// })

// mockOp.stdout.on('data', (data) => console.log('stdout:', data))
// mockOp.stderr.on('data', (data) => console.log('stderr:', data))

// mockOp.on('customEvent', (data) => console.log('Event:', data))
// mockOp.on('end', () => console.log('Operation ended.'))
// mockOp.on('close', () => console.log('Operation closed.'))

// Simulate messages
// mockObservable.next({ stream: 'stdout', data: 'Hello, World!' })
// mockObservable.next({ stream: 'stderr', data: 'An error occurred.' })
// mockObservable.next({ event: 'customEvent', data: 'Custom event payload.' })
// mockObservable.next({ stream: 'stdout', event: 'end' })
// mockObservable.next({ stream: 'stderr', event: 'end' })

// Complete the operation
// mockObservable.complete()
