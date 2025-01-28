#!/usr/bin/env node
import { readChar, readString, read, readArray, readRecord } from '@kingjs/cli-read'
import { write, writeRecord } from '@kingjs/cli-echo'
import fs from 'fs'
import CliFdReadable from '@kingjs/cli-fd-readable'
import CliFdWritable from '@kingjs/cli-fd-writable'
import assert from 'assert'

const DEFAULT_IFS = ' '
const STDIN_FD = 0
const STDOUT_FD = 1
const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const EXIT_ERRORED = 2
const EXIT_ABORT = 128
const EXIT_SIGINT = EXIT_ABORT + 2

class Cli {
  static metadata = Object.freeze({
    options: {
      help: { type: 'boolean', description: 'Show help' },
      version: { type: 'boolean', description: 'Show version number' },
      verbose: { type: 'boolean', description: 'Provide verbose output' },
      stdis: { type: 'boolean', description: 'Provide status updates' },
      stdisFd: { 
        type: 'number', 
        description: 'Fd to report status if stdis is set', 
        env: 'STDIS_FD',
        default: STDOUT_FD
      },
      ifs: { 
        type: 'string', 
        description: 'Internal field separator', 
        env: 'IFS',
        default: DEFAULT_IFS
      },
    }
  })

  static toError(err) {
    return err instanceof Error ? err : new Error(err || 'Internal error')
  }

  static getDefaults(options = {}) {
    return Object.fromEntries(
      Object.entries(options).map(([key, { default: value }]) => [key, value])
    )
  }

  constructor({ verbose, stdis, stdisFd = STDOUT_FD, ifs = DEFAULT_IFS } = {}) {
    this.verbose = verbose
    
    this.stderr = process.stderr

    this.ifs = ifs
    const abortController = new AbortController()
    this.signal = abortController.signal

    this.stdin = new CliFdReadable(STDIN_FD) // Use stdin file descriptor
    this.stdout = process.stdout // Use stdout file descriptor
    if (stdis) {
      this.stdis = stdisFd == STDOUT_FD ? process.stdout : new CliFdWritable(stdisFd)
    }

    // handle abort initiation
    process.once('SIGINT', () => {
      this.is$('aborting')
      abortController.abort()
    })

    // handle graceful shutdown
    process.once('beforeExit', async () => {
      const code = process.exitCode

      this.is$(
        this.succeeded ? 'succeeded' :
        this.aborted ? 'aborted' :
        this.errored ? 'errored' :
        'failed', code)
    })
    
    // handle ungraceful shutdown
    process.once('uncaughtException', (err) => {
      this.error$(err)
    })

    process.once('unhandledRejection', (reason) => {
      this.error$(reason)
    })

    // report status
    this.is$('initializing')
    setTimeout(() => {
      if (this.initializing)
        this.is$('processing')
    })
  }

  async write(line) {
    return await write(this.stdout, this.signal, line)
  }

  async writeRecord(fields) {
    return await writeRecord(this.stdout, this.signal, this.ifs, fields)
  }

  async readChar() {
    return await readChar(this.stdin, this.signal)
  }

  async readString(charCount) {
    return await readString(this.stdin, this.signal, charCount)
  }

  async read() {
    return await read(this.stdin, this.signal)
  }

  async readArray() {
    return await readArray(this.stdin, this.signal, this.ifs)
  }

  async readRecord(fields) {
    return await readRecord(this.stdin, this.signal, this.ifs, fields)
  }

  async is$(name, data = null) {
    this.state$ = { name, data }
    if (this.stdis) {
      const fields = [name, this.toString()]
      await writeRecord(this.stdis, this.signal, ' ', fields)
    }
  }

  async success$() {
    assert(!this.aborting)
    this.is$('stopping')
    process.exitCode = EXIT_SUCCESS
    assert(this.succeeded)
  }

  abort$() {
    assert(this.aborting)
    this.is$('stopping')
    process.exitCode = EXIT_SIGINT
    assert(this.aborted)
  }

  fail$(code = EXIT_FAILURE) {
    assert(!this.aborting)
    this.is$('stopping')
    process.exitCode = code
    assert(this.failed)
  }

  error$(error) {
    assert(!this.aborting)
    console.error(Cli.toError(error))
    this.is$('stopping')
    process.exitCode = EXIT_ERRORED
    assert(this.errored)
  }

  get initializing() { return this.state$.name == 'initializing' }
  get processing() { return this.state$.name == 'processing' }
  get aborting() { return this.state$.name == 'aborting' }
  get stopping() { return this.state$.name == 'stopping' }
  get succeeded() { return process.exitCode == EXIT_SUCCESS }
  get aborted() { return process.exitCode == EXIT_SIGINT }
  get errored() { return process.exitCode == EXIT_ERRORED }
  get failed() { return process.exitCode == EXIT_FAILURE }

  toString() {
    const { name, data } = this.state$

    if (this.succeeded)
      return 'Command completed successfully'
    if (this.aborted)
      return `Command aborted`
    if (this.failed)
      return `Command exited with code ${data}`
    if (this.errored)
      return `Command encountered an error: ${data}`

    return name.charAt(0).toUpperCase() + name.slice(1) + '...'
  }
}

export { Cli }
