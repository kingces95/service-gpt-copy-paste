import { CliTerminal } from '@kingjs/cli-terminal'
import { CliRxPollerState } from '@kingjs/cli-rx-poller'
import { CliRuntimeState } from '@kingjs/cli-runtime'
import { CliDaemon, CliDaemonState } from '@kingjs/cli-daemon'
import { CliPulse } from '@kingjs/cli-pulse'
import { CliConsole, CliConsoleMon } from '@kingjs/cli-console'
import { cliSubshellToPojo } from '@kingjs/cli-subshell-to-pojo'
import { dumpPojo } from '@kingjs/pojo-dump'
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
    let result = undefined
    // result = await $`bash -c ${'echo hello world!'}`({ stdout: 'temp.txt' })

    // result = await ($({ IFS: ',' })($ => $.echo($.env.IFS)))
    
    // result = await $({ IFS: ',' })
    //   ($ => $.echo($.env.IFS))
    //   ({ stdout: process.stdout })

    // result = await $`this poll`

    // result = await $`this dispatch`(
    //   '!#/clipboard/echo hello world'
    // )

    // result = await $`this dispatch`(
    //   '!#/clipboard/echo ok'
    // )({ stdout: 'temp.txt' })

    // result = await $(
    //   async $ => {
    //     await $.echo('!#/clipboard/echo ok')
    //     // $.stdout.on('end', () => console.error('stdout.end'))
    //     // $.stdout.end()
    //     // console.error('done')
    //   },
    //   $`this dispatch`,
    //   // async $ => {
    //   //   console.error('2')
    //   //   $.stdin.on('end', () => console.error('stdin.end'))
    //   //   $.stdin.pipe($.stdout)
    //   // },
    // )

    // result = await $(
    //   async $ => { 
    //     await $.echo('echo hello world')
    //     // $.stdout.end()
    //     // subshell fails to explictly close stdout
    //   },
    //   async $ => {
    //     const line = await $.read()
    //     await $.echo(line) 
    //   }
    // )

    // result = await $(
    //   // { stdin: 'temp.txt' },
    //   async $ => {
    //     await $.echo('!#/clipboard/echo ok')
    //   },
    //   $`this dispatch`,
    //   async $ => { 
    //     let line = null
    //     while (line = await $.read())
    //       await $.echo(line)
    //   },
    //   async $ => { 
    //     let line = null
    //     $.read()//.__dump()
    //     while (line = await $.read())
    //       await $.echo(line)
    //   },
    //   // $(async $ => { $.stdin.pipe($.stdout) })
    //     // ({ stdout: 'out.txt' }),
    // ).__dump()
    // ({ stdin: 'in.txt' })
    // ({ stdin: '/dev/null' })
    // (['here', 'doc'])
    // ('here-string')
    // ((function* itr() { yield 'hello world' })())
    // result = await cliSubshellToPojo(result)
    // dumpPojo(result)
    // return

    // result = await $`this poll --stdmon /dev/null`({
    //   stdout: $`this dispatch`,
    // })//.__dump()

    // result = await $`this dispatch`({
    //   stdin: $`this poll --stdmon /dev/null`,
    // })

    // result = await $.pipeline(
    //   $`this poll --stdmon /dev/null`,
    //   $`this dispatch`,
    // )

    // result = await $(
    //   $`this poll --stdmon /dev/null`,
    //   $`this dispatch`,
    // )

    // result = await $(
    //   'this poll'
    // )

    // result = await $(async $ => {
    //   return await $`this dispatch`
    // })({ 
    //   stdin: $`this poll --stdmon /dev/null`, 
    // })

    // result = await $(async $ => {
    //   return await $`this poll --stdmon /dev/null`()
    // })({ 
    //   stdout: $`this dispatch`, 
    // })

    // result = await $(async $ => {
    //   return await $`this poll --stdmon /dev/null`()
    // })({ 
    //   stdout: $`this dispatch`, 
    // })

    // result = await $(async function($) {
    //   return 42
    // })

    // result = await $(
    //   $`this poll`,
    //   async function($) { 
    //     const line = await $.read()
    //     $.stdin.pipe($.stdout)
    //     return 0
    //   }
    // )

    // result = await $(
    //   $`this poll --stdmon /dev/null`,
    //   $`this dispatch`,
    //   async function($) { 
    //     const line = await $.read()
    //     $.stdin.pipe($.stdout)
    //     return 0
    //   }
    // )

    // result = await $(
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
    // )

    // await $`this dispatch`('!#/clipboard/echo hello world')
    // await $`this dispatch`('!#/clipboard/echo hello world')

    // while (!$.signal.aborted) {
    //   await $`this dispatch`('!#/clipboard/echo hello world')
    // }

    while ($.signal.aborted == false) {
      result = await $(
        $`this poll --stdmon /dev/null`,
        $`this dispatch`,
      )()
      console.error(result)
    }

    console.error(result)
  }
}
