#!/usr/bin/env node
import { Clipboard } from '@napi-rs/clipboard'
import { exhaustMap, filter, first } from 'rxjs/operators'
import { CliPoller } from '@kingjs/cli-poller'

const PREFIX = '!#/clipboard/'

export default class CliPollClipboard extends CliPoller {
  static metadata = Object.freeze({
    name: 'poll',
    description: 'Poll clipboard content',
    options: {
      prefix: { type: 'string', default: PREFIX, description: 'Prefix to match in clipboard content.' },
    }
  })

  constructor(options) {
    const { 
      prefix = PREFIX, 
      ...rest 
    } = options
    
    const clipboard = new Clipboard()
    super(rest,
      exhaustMap(async () => clipboard.getText()),
      filter((content) => content.startsWith(prefix)),
      first()
    )

    return this
  }
}
