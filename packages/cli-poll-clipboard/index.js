#!/usr/bin/env node
import { CliRxPoller } from '@kingjs/cli-rx-poller'
import { Clipboard } from '@napi-rs/clipboard'
import { exhaustMap, filter, first } from 'rxjs/operators'

const PREFIX = '!#/clipboard/'

export default class CliPollClipboard extends CliRxPoller {
  static description = 'Poll clipboard content'
  static parameters = {
    prefix: 'Prefix to match in clipboard content'
  }
  static { this.initialize() }

  constructor({ prefix = PREFIX, ...rest } = { }) {
    if (CliPollClipboard.initializing(new.target, { prefix }))
      return super()

    const clipboard = new Clipboard()
    super(rest,
      exhaustMap(async () => clipboard.getText()),
      filter((content) => content.startsWith(prefix)),
      first()
    )

    return this
  }
}

// CliPollClipboard.__dumpMetadata()
