#!/usr/bin/env node
import { Cli } from '@kingjs/cli'
import { writeRecord } from '@kingjs/cli-echo'
import { streamNull } from '@kingjs/stream-null'
import { CliServiceHeartbeat } from '@kingjs/cli-service-heartbeat'
import { CliFdWritable } from '@kingjs/cli-fd-writable'
import assert from 'assert'

const STDOUT_FD = 1
const IFS = ' '

export class CliService extends Cli {
  static metadata = Object.freeze({
    options: {
      stdis: { type: 'boolean', description: 'Provide status updates' },
      stdisFd: { 
        type: 'number', 
        description: 'Fd to report status if stdis is set', 
        env: 'STDIS_FD',
        default: STDOUT_FD
      }
    }
  })

  constructor({ stdis, stdisFd = STDOUT_FD, ...options } = {}) {
    super(options)
    this.heartbeatService = new CliServiceHeartbeat()
    this.stdis = stdis ? new CliFdWritable({ fd: stdisFd }) : streamNull
    
    const abortController = new AbortController()
    this.signal = abortController.signal

    process.once('SIGINT', () => {
      this.is$('aborting')
      abortController.abort()
    })

    process.once('beforeExit', async () => {
      const code = process.exitCode
      assert(code !== undefined)
      this.update$('exiting', code)

      this.is$(
        this.succeeded ? 'succeeded' :
        this.aborted ? 'aborted' :
        this.errored ? 'errored' :
        'failed'
      )
    })

    this.heartbeatService.start$((cpu, memory) => {
      this.update$('data', 
        this.stdin.count, this.stdout.count, this.stderr.count, 
        cpu, memory)
    })
    this.is$('initializing')
  }

  async update$(...fields) {
    await writeRecord(this.stdis, this.signal, IFS, [...fields])
  }

  async warnThat$(name) {
    this.state$ = name
    await this.update$('warning', name, this.toString())
  }
  
  async is$(name) {
    this.state$ = name
    await this.update$(name, this.toString())
  }

  async stop$() {
    await this.heartbeatService.stop$()
    await this.is$('stopping')
  }

  async success$() {
    assert(!this.aborting)
    super.success$()
    await this.stop$()
  }

  async abort$() {
    assert(this.aborting)
    super.abort$()
    await this.stop$()
  }

  async fail$(code = EXIT_FAILURE) {
    assert(!this.aborting)
    super.fail$(code)
    await this.stop$()
  }

  async error$(error) {
    assert(!this.aborting)
    super.error$(error)
    await this.stop$()
  }

  get initializing() { return this.state$ == 'initializing' }
  get aborting() { return this.state$ == 'aborting' }
  get stopping() { return this.state$ == 'stopping' }

  toString() {
    if (!this.running) return super.toString()
    const state = this.state$
    return state.charAt(0).toUpperCase() + state.slice(1) + '...'
  }
}
