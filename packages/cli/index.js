#!/usr/bin/env node
import { readChar, readString, read, readArray, readRecord } from '@kingjs/cli-read'
import { splitRecord, splitArray } from '@kingjs/cli-read'
import { write, joinFields } from '@kingjs/cli-echo'
import { Console } from 'console'
import { CliFdReadable } from '@kingjs/cli-fd-readable'
import { CliFdWritable }from '@kingjs/cli-fd-writable'
import assert from 'assert'

const CLI_INFO_SYMBOL = Symbol('Cli Info')

const DEFAULT_IFS = ' '
const STDIN_FD = 0
const STDOUT_FD = 1
const STDERR_FD = 2
const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const EXIT_ERRORED = 2
const EXIT_ABORT = 128
const EXIT_SIGINT = EXIT_ABORT + 2

const IFS = DEFAULT_IFS

export class Cli {
  static metadata = Object.freeze({
    options: {
      help: { type: 'boolean', description: 'Show help' },
      version: { type: 'boolean', description: 'Show version number' },
      verbose: { type: 'boolean', description: 'Provide verbose output' },
    }
  })

  static InfoSymbol = CLI_INFO_SYMBOL

  static async splitArray(line) {
    return splitArray(line, IFS)
  }

  static async splitRecord(line, fields) {
    return splitRecord(line, IFS, fields)
  }

  static joinFields(fields) {
    return joinFields(IFS, fields)
  }

  constructor({ verbose, [Cli.InfoSymbol]: info } = {}) {
    this.verbose = verbose
    this.info = info
    
    // handle graceful shutdown
    this.exitCode = undefined
    process.once('beforeExit', async () => {
      process.exitCode = this.exitCode
    })

    // wrap standard streams
    this.stdin = new CliFdReadable({ fd: STDIN_FD }) // Use stdin file descriptor
    this.stdout = new CliFdWritable({ fd: STDOUT_FD }) // Use stdout file descriptor
    this.stderr = new CliFdWritable({ fd: STDERR_FD }) // Use stdout file descriptor
    this.console = new Console({
      stdout: this.stdout,
      stderr: this.stderr,
      colorMode: true, // Enable color support
    });      
    
    // handle ungraceful shutdown
    this.exitError = undefined
    process.once('uncaughtException', (error) => {
      this.error$(error)
    })

    process.once('unhandledRejection', (reason) => {
      this.error$(reason)
    })
  }

  async write(line) {
    return write(this.stdout, this.signal, line)
  }

  async writeRecord(fields) {
    return write(Cli.joinFields(fields))
  }

  async readChar() {
    return readChar(this.stdin, this.signal)
  }

  async readString(charCount) {
    return readString(this.stdin, this.signal, charCount)
  }

  async read() {
    return read(this.stdin, this.signal)
  }

  async readArray() {
    return readArray(this.stdin, this.signal, IFS)
  }

  async readRecord(fields) {
    return readRecord(this.stdin, this.signal, IFS, fields)
  }

  async success$() {
    this.exitCode = EXIT_SUCCESS
  }

  async abort$() {
    this.exitCode = EXIT_SIGINT
  }

  async fail$(code = EXIT_FAILURE) {
    this.exitCode = code
  }

  async error$(error) {
    this.exitError = error
    this.exitCode = EXIT_ERRORED
    error = error instanceof Error 
      ? error 
      : new Error(err || 'Internal error')
    console.error(error)
  }

  get running() { return process.exitCode === undefined }
  get succeeded() { return process.exitCode == EXIT_SUCCESS }
  get aborted() { return process.exitCode == EXIT_SIGINT }
  get errored() { return process.exitCode == EXIT_ERRORED }
  get failed() { return process.exitCode == EXIT_FAILURE }

  toString() {
    if (this.succeeded)
      if (this.stderr.count)
        return 'Command succeeded with warnings'
      else
        return 'Command succeeded'
    if (this.aborted)
      return `Command aborted`
    if (this.failed)
      return `Command failed`
    if (this.errored)
      return `Command exception: ${this.exitError}`
    
    assert(this.running)
    return 'Running...'
  }
}
