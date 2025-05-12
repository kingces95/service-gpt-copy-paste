import { CliRxPoller, CliRxPollerState } from '@kingjs/cli-rx-poller'
import { CliRuntimeState } from '@kingjs/cli-runtime'
import { CliDaemonState } from '@kingjs/cli-daemon'
import { CliPulse } from '@kingjs/cli-pulse'
import { CliConsoleMon } from '@kingjs/cli-console'
import { Clipboard } from '@napi-rs/clipboard'
import { exhaustMap, filter, first, scan, map } from 'rxjs/operators'
import { pipe } from 'rxjs'
import { CliTerminal } from '@kingjs/cli-terminal'
import { write } from 'fast-csv'

const PREFIX = '!#/clipboard/'

export class Clip extends CliTerminal {
  static description = 'Read and write to the clipboard'
  static commands = () => ({
    read: ClipRead,
    write: ClipWrite,
  })
  static { this.initialize(import.meta) }

  constructor({ ...rest } = { }) {
    if (Clip.initializing(new.target, { }))
      return super()
    super(rest)
  }
}

class ClipRead extends Clip {
  static description = 'Read from the clipboard'
  static { this.initialize(import.meta) }

  constructor({ ...rest } = { }) {
    if (ClipRead.initializing(new.target, { }))
      return super()
    super(rest)
  }

  run($) {
    const clipboard = new Clipboard()
    return clipboard.getText()
  }
}

class ClipWrite extends Clip {
  static description = 'Write to the clipboard'
  static { this.initialize(import.meta) }
  
  constructor({ ...rest } = { }) {
    if (ClipWrite.initializing(new.target, { }))
      return super()
    super(rest)
  }

  run($) {
    const clipboard = new Clipboard()
    return clipboard.setText(this.args.join(' '))
  }
}