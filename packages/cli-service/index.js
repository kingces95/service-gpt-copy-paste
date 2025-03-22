#!/usr/bin/env node
import { CliCommand } from '@kingjs/cli-command'
import { CliServiceHeartbeat } from '@kingjs/cli-service-heartbeat'
import { CliServiceState } from './state.js'
import assert from 'assert'

export class CliService extends CliCommand {
  static services = [ CliServiceState ]
  static { this.initialize() }

  get #stateService() { return this.getService(CliServiceState) }

  #service

  constructor(options) {
    if (CliService.initializing(new.target)) 
      return super()
    super(options)

    this.heartbeatService = new CliServiceHeartbeat()
    
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
    this.is$('starting')
  }

  get state$() { return this.#stateService.state }
  async update$(...fields) { this.#stateService.update(...fields) }
  async warnThat$(name) { this.#stateService.warnThat(name) } 
  async is$(name) { this.#stateService.is(name) }

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

  get starting() { return this.state$ == 'starting' }
  get aborting() { return this.state$ == 'aborting' }
  get stopping() { return this.state$ == 'stopping' }

  toString() { return this.#stateService.toString() }
}

// CliService.__dumpMetadata()
