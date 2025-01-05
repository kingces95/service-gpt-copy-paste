#!/usr/bin/env node
import { EventEmitter } from 'events'
import { PassThrough } from 'stream'

class Cli extends EventEmitter {
  static metadata = Object.freeze({
    options: {
      help: { type: 'boolean', describe: 'Show help', default: false },
      version: { type: 'boolean', describe: 'Show version number', default: false },
      verbose: { type: 'boolean', describe: 'Provide verbose output', default: false },
    }
  })
  
  static isErrored(state) {
    return state === 'error'
  }
  
  static isFinished(state) {
    return state === 'exit' || state === 'close' || this.isErrored(state)
  }
  
  static isSuccess(state, code, signal) {
    // shell semantic is 0 for success, otherwise failure
    return Cli.isFinished(state) && !Cli.isErrored(state) && !code && !signal
  }

  static isFailure(state, code) {
    return Cli.isFinished(state) && !Cli.isErrored(state) && code
  }

  static isAborted(state, _, signal) {
    return Cli.isFinished(state) && !Cli.isErrored(state) && signal
  }
  
  static toError(err) {
     return err instanceof Error ? err : new Error(err || 'Internal error')
  }
  
  static getDefaults(options = {}) {
    return Object.fromEntries(
      Object.entries(options).map(([key, { default: value }]) => [key, value])
    )
  }

  constructor({ abort, verbose } = {}) {
    super()
    this.verbose = verbose

    this.stdin = new PassThrough()
    this.stdout = new PassThrough()
    this.stderr = new PassThrough()

    setTimeout(() => this.is$('processing'))
  }

  is$(event, ...data) {
    this.emit('status', event, ...data)
  }
  
  async emit$(event, ...data) {
    this.is$(event, ...data)
    await this.emit(event, ...data)
  }  

  exit$(code, signal) {
    this.emit$('exit', code, signal)
  }  
  
  async $close(code, signal) {
    await new Promise((resolve) => this.stdout.end(resolve))
    await new Promise((resolve) => this.stderr.end(resolve))
    this.emit$('close', code, signal)
  }  

  error$(err) {
    this.emit$('error', Cli.toError(err))
  }  
  
  async exitAndClose$(code, signal = null) { 
    this.exit$(code, signal)
    await this.$close(code, signal)
  }    
  success$() { this.exitAndClose$(0) }
  failure$(code = 1) { this.exitAndClose$(code) }
  aborted$(signal = 'SIGINT') { this.exitAndClose$(null, signal) }
  
  toString(state, result, ...rest) {
    if (Cli.isSuccess(state, result, ...rest))
      return `Cli command completed successfully`
    
    if (Cli.isFailure(state, result, ...rest))
      return `Cli command exited with code ${result}`
    
    if (Cli.isAborted(state, result, ...rest)) {
      const [ signal ] = rest
      return `Cli command aborted due to ${signal}`
    }

    if (Cli.isErrored(state, result, ...rest))
      return `Error: ${result.message}`

    if (!state || typeof(state) != 'string')
      return 'Cli command exited with unknown status'

    return `${state.charAt(0).toUpperCase() + state.slice(1)}...`
  }
}

export { Cli }
