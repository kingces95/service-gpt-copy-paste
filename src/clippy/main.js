import { CliTerminal } from '@kingjs/cli-terminal'
import { CliRxPollerState } from '@kingjs/cli-rx-poller'
import { CliRuntimeState } from '@kingjs/cli-runtime'
import { CliDaemon, CliDaemonState } from '@kingjs/cli-daemon'
import { CliPulse } from '@kingjs/cli-pulse'
import { CliConsole, CliConsoleMon } from '@kingjs/cli-console'

// e.g., !#/clipboard/shell/bash echo hello world
// e.g., !#/clipboard/http/get https://example.com
// e.g., !#/clipboard/throw
// e.g., !#/clipboard/echo hello world

export default class Main extends CliTerminal {
  static description = 'Poll and dispatch commands from the clipboard'
  static services = {
    // runtimeState: CliRuntimeState,
    // deamonState: CliDaemonState,
    // pollerState: CliRxPollerState,
    // pulse: CliPulse,
    // consoleMon: CliConsoleMon,
  }
  static { this.initialize(import.meta) }

  constructor(options) {
    if (Main.initializing(new.target))
      return super()
    super(options)
  }

  async run(shell) {
    // const result = await shell.$`this poll`()

    // const result = await shell.$`this dispatch`(
    //   '!#/clipboard/echo hello world'
    // )()

    // const result = await shell.$`this poll --stdmon /dev/null`({
    //   stdout: shell.$`this dispatch`,
    // })()

    // const result = await shell.$`this dispatch`({
    //   stdin: shell.$`this poll --stdmon /dev/null`,
    // })()

    const result = await shell.pipeline(
      shell.$`this poll --stdmon /dev/null`,
      shell.$`this dispatch`,
    )

    // const result = await shell.subshell(async shell => {
    //   return await shell.$`this dispatch`()
    // })({ 
    //   stdin: shell.$`this poll --stdmon /dev/null`, 
    // })()

    //while (signal.aborted == false) {
      // shell.pipeline(
      //   shell.$`this poll --stdmon /dev/null`,
      //   shell.$`this dispatch`,
      // )
    //}

    console.error(result)
  }
}
