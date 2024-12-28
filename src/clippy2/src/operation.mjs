import { EventEmitter } from 'events'
import { PassThrough } from 'stream'

export default class Operation extends EventEmitter {
  constructor(signal) {
    super()

    // Validate AbortSignal
    if (signal && !(signal instanceof AbortSignal)) {
      throw new Error('Operation constructor expects an AbortSignal as the signal parameter.')
    }

    this.signal = signal
    this.out = new PassThrough({ objectMode: true }) // Output stream (stub stream)
    this.err = new PassThrough({ objectMode: true }) // Error stream (stub stream)
    this.result = null // Result of the operation

    // Handle abort signal
    this.signal.addEventListener('abort', () => {
      this.end()
    })
  }

  /**
   * Cleanup resources (to be called on abort or completion)
   */
  end(result) {
    this.result = result
    this.out.end()
    this.err.end()
    this.emit('end', result) // Emit end event with result
  }

  /**
   * Static activation function to create and return an operation instance.
   * @param {...any} args Arguments required for the operation
   * @returns {Operation}
   */
  static create(...args) {
    throw new Error('Subclasses must implement the static activate method.')
  }
}
