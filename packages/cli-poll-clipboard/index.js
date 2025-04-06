#!/usr/bin/env node
import { CliRxPoller, CliRxPollerState } from '@kingjs/cli-rx-poller'
import { Clipboard } from '@napi-rs/clipboard'
import { exhaustMap, filter, first } from 'rxjs/operators'
import { pipe } from 'rxjs'
import { CliRuntimeState } from '@kingjs/cli-runtime'
import { CliPulse, CliDaemonState } from '@kingjs/cli-daemon'

const PREFIX = '!#/clipboard/'

export default class CliPollClipboard extends CliRxPoller {
  static description = 'Poll clipboard content'
  static parameters = {
    prefix: 'Prefix to match in clipboard content'
  }
  static services = {
    runtimeState: CliRuntimeState,
    deamonState: CliDaemonState, 
    pollerState: CliRxPollerState,
    pulse: CliPulse,
  }
  static { this.initialize(import.meta) }

  #prefix

  constructor({ prefix = PREFIX, ...rest } = { }) {
    if (CliPollClipboard.initializing(new.target, { prefix }))
      return super()
    super(rest)

    this.getServices(CliPollClipboard, rest)
    this.#prefix = prefix
  }

  get prefix() { return this.#prefix }

  poll(signalRx) {
    const { prefix } = this
    const clipboard = new Clipboard()
    
    return pipe(
      exhaustMap(async () => clipboard.getText()),
      filter((content) => content.startsWith(prefix)),
      first()
    )
  }
}

// CliPollClipboard.__dumpMetadata()
