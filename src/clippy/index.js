import { CliCommand } from '@kingjs/cli-command'
import { CliRxPollerState } from '@kingjs/cli-rx-poller'
import { CliRuntimeState } from '@kingjs/cli-runtime'
import { CliDaemonState } from '@kingjs/cli-daemon'
import { CliPulse } from '@kingjs/cli-pulse'
import { CliConsole, CliConsoleMon } from '@kingjs/cli-console'
import { Shell } from '@kingjs/shell'

export default class CliDispatch extends CliCommand {
  static description = 'Dispatch commands to other modules'
  static parameters = {
    prefix: 'Prefix to match in clipboard content'
  }
  static services = {
    console: CliConsole,

    // runtimeState: CliRuntimeState,
    // deamonState: CliDaemonState,
    // pollerState: CliRxPollerState,
    // pulse: CliPulse,
    // consoleMon: CliConsoleMon,
  }
  static { this.initialize(import.meta) }

  #console

  constructor(options) {
    if (CliDispatch.initializing(new.target))
      return super()
    super(options)

    const { console } = this.getServices(CliDispatch)
    this.#console = console
  }

  async run(signal) {
    const console = this.#console
    // e.g., !#/clipboard/shell/bash echo hello world
    // e.g., !#/clipboard/http/get https://example.com
    // e.g., !#/clipboard/throw
    const [shebang = null, ...args] = await console.readArray(signal)
    const [_, _clipboard, command, ...route] = shebang.split('/')

    // await console.echo(`Shebang: ${shebang}`)
    // await console.echo(`Command: ${command}, Route: ${route.join('/')}`)
    // await console.echo(`Args: ${args.join(' ').trim()}`)

    const { $ } = Shell.bind({ signal })
    switch (command) {
      case 'shell':
      case 'http': 
        // cli shell <ps|wsl|bash|cmd> [...args]
        // cli http <get|post|put|delete|patch|head> <url>
        const cmd = await $`${command} ${route} ${args}`.launch()//.out().in().run()
        break
      case 'throw':
        throw new Error('This is an error thrown for testing.')
      default:
        this.emit('failure', `Invalid command: ${command}`)
    }
  }
}

export const Clippy = CliCommand.extend({
  name: 'Clippy',
  description: 'My funky cli',
  commands: {
    poll: '@kingjs/cli-poll-clipboard',
    http: '@kingjs/cli-http',
    orb: '@kingjs/cli-orb',
    shell: '@kingjs/cli-eval',
    spy: '@kingjs/cli-spy',
    name: '@kingjs/cli-node-name',
    err: '@kingjs/cli-simulator',
    run: CliDispatch,
  },
  groups: [
    ['Polling',
      '@kingjs/cli-rx-poller'],
    ['Pulse',
      '@kingjs/cli-pulse, CliPulse'],
    ['I/O',
      '@kingjs/cli-std-stream, CliStdStream',
      '@kingjs/cli-reader, CliParser',],
    ['Global',
      '@kingjs/cli-command'],
  ]
})
