import { CliRxPoller, CliRxPollerState } from '@kingjs/cli-rx-poller'
import { Clipboard } from '@napi-rs/clipboard'
import { exhaustMap, filter, first } from 'rxjs/operators'
import { pipe } from 'rxjs'
import { CliRuntimeState } from '@kingjs/cli-runtime'
import { CliDaemonState } from '@kingjs/cli-daemon'
import { CliPulse } from '@kingjs/cli-pulse'
import { CliConsoleMon } from '@kingjs/cli-console'

const PREFIX = '!#/clipboard/'

export default class Poll extends CliRxPoller {
  static description = 'Poll clipboard content'
  static parameters = {
    prefix: 'Prefix to match in clipboard content'
  }
  static services = {
    runtimeState: CliRuntimeState,
    deamonState: CliDaemonState, 
    pollerState: CliRxPollerState,
    pulse: CliPulse,
    console: CliConsoleMon,
  }
  static { this.initialize(import.meta) }

  #prefix

  constructor({ prefix = PREFIX, ...rest } = { }) {
    if (Poll.initializing(new.target, { prefix }))
      return super()
    super(rest)

    this.getServices(Poll)
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

// Poll.__dumpMetadata()
