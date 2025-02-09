#!/usr/bin/env node
import { Cli } from '@kingjs/cli'
import { CliRxPoller } from '@kingjs/cli-rx-poller'
import { Clipboard } from '@napi-rs/clipboard'
import { exhaustMap, filter, first } from 'rxjs/operators'

const PREFIX = '!#/clipboard/'

export class CliPollClipboard extends CliRxPoller {
  static info = CliPollClipboard.load()
  static description = 'Poll clipboard content'
  static descriptions = {
    prefix: 'Prefix to match in clipboard content.'
  }

  constructor({ prefix = PREFIX, ...rest } = { }) {
    if (Cli.isLoading(arguments) || CliPollClipboard.saveDefaults({ prefix }))
      return super(Cli.loading)

    const clipboard = new Clipboard()
    super(rest,
      exhaustMap(async () => clipboard.getText()),
      filter((content) => content.startsWith(prefix)),
      first()
    )

    return this
  }
}

// CliPollClipboard.__dumpLoader()
