// Import required modules
import { EventEmitter } from 'events'

export default class Accumulator extends EventEmitter {
  constructor() {
    super()
    this.output = []
    this.error = []
    this.data = []
    this.outputCount = 0
    this.errorCount = 0
    this.totalCount = 0
  }

  accumulate({ output = '', error = '' }) {
    // Accumulate output and error chunks if they are not empty
    if (output) {
      this.output.push(output)
      this.data.push(output)
      this.outputCount += output.length
    }

    if (error) {
      this.error.push(error)
      this.data.push(error)
      this.errorCount += error.length
    }

    // Update total count
    this.totalCount = this.outputCount + this.errorCount

    this.emit('data', {
      output: this.output,
      error: this.error,
      data: this.data,
      outputCount: this.outputCount,
      errorCount: this.errorCount,
      totalCount: this.totalCount
    })
  }
}

export { Accumulator }
