import { CliTerminal } from '@kingjs/cli-terminal'
import { CliRxPollerState } from '@kingjs/cli-rx-poller'
import { CliRuntimeState } from '@kingjs/cli-runtime'
import { CliDaemon, CliDaemonState } from '@kingjs/cli-daemon'
import { CliPulse } from '@kingjs/cli-pulse'
import { CliConsole, CliConsoleMon } from '@kingjs/cli-console'
import clipboardy from 'clipboardy'

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

  async run($) {
    // const result = await $`this poll`()

    // const result = await $`this dispatch`(
    //   '!#/clipboard/echo hello world'
    // )()

    // const result = await $`this poll --stdmon /dev/null`({
    //   stdout: $`this dispatch`,
    // })()

    // const result = await $`this dispatch`({
    //   stdin: $`this poll --stdmon /dev/null`,
    // })()

    // const result = await $.pipeline(
    //   $`this poll --stdmon /dev/null`,
    //   $`this dispatch`,
    // )()

    // const result = await $(
    //   $`this poll --stdmon /dev/null`,
    //   $`this dispatch`,
    // )()

    // const result = await $(
    //   'this poll'
    // )()

    // const result = await $.subshell(async $ => {
    //   return await $`this dispatch`()
    // })({ 
    //   stdin: $`this poll --stdmon /dev/null`, 
    // })()

    // const result = await $.subshell(async $ => {
    //   return await $`this poll --stdmon /dev/null`()
    // })({ 
    //   stdout: $`this dispatch`, 
    // })()

    // const result = await $(async $ => {
    //   return await $`this poll --stdmon /dev/null`()
    // })({ 
    //   stdout: $`this dispatch`, 
    // })()

    // const result = await $(async function($) {
    //   return 42
    // })()

    // const result = await $(
    //   $`this poll --stdmon /dev/null`,
    //   $`this dispatch`,
    //   async function($) { 
    //     $.stdin.pipe($.stdout)
    //     return 0
    //   }
    // )()

    // const result = await $(
    //   async function*($) {
    //     yield 'hello'
    //     yield 'world'
    //     // yield a string buffer
    //     yield Buffer.from('hello world\n')
    //   },
    //   async function($) {
    //     for await (const line of $) {
    //       // make line upper case
    //       $.stdout.write(line.toUpperCase())
    //       $.stdout.write('\n')
    //     }
    //   }
    // )()

    // await $`this dispatch`('!#/clipboard/echo hello world')()
    // await $`this dispatch`('!#/clipboard/echo hello world')()

    // while (!$.signal.aborted) {
    //   await $`this dispatch`('!#/clipboard/echo hello world')()
    // }

    while ($.signal.aborted == false) {
      const result = await $(
        $`this poll --stdmon /dev/null`,
        $`this dispatch`,
      )()
      console.error(result)
    }

    return 0
    // console.error(result)
  }
}
