#!/usr/bin/env node
import { CliRxPoller } from '@kingjs/cli-rx-poller'
import { Clipboard } from '@napi-rs/clipboard'
import { exhaustMap, filter, first } from 'rxjs/operators'
import { pipe } from 'rxjs'

const PREFIX = '!#/clipboard/'

export default class CliPollClipboard extends CliRxPoller {
  static description = 'Poll clipboard content'
  static parameters = {
    prefix: 'Prefix to match in clipboard content'
  }
  static { this.initialize(import.meta) }

  #prefix

  constructor({ prefix = PREFIX, ...rest } = { }) {
    if (CliPollClipboard.initializing(new.target, { prefix }))
      return super()
    super(rest)

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
