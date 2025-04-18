import { CliConsole } from '@kingjs/cli-console'
import { CliTerminal } from '@kingjs/cli-terminal'

export default class Dispatch extends CliTerminal {
  static description = 'Dispatch commands to other modules'
  static services = {
    console: CliConsole,
  }
  static { this.initialize(import.meta) }

  #console

  constructor(options) {
    if (Dispatch.initializing(new.target))
      return super()
    super(options)

    const { console } = this.getServices(Dispatch)
    this.#console = console
  }

  async run(shell) {
    const { signal } = shell
    const console = this.#console
    const [shebang = null, ...args] = await console.readArray(signal)
    const [_, _clipboard, command, ...route] = shebang.split('/')

    // await console.echo(`Shebang: ${shebang}`)
    // await console.echo(`Command: ${command}, Route: ${route.join('/')}`)
    // await console.echo(`Args: ${args.join(' ').trim()}`)

    switch (command) {
      case 'shell':
      case 'http': 
        // cli shell <ps|wsl|bash|cmd> [...args]
        // cli http <get|post|put|delete|patch|head> <url>
        const cmd = await shell.$$`${command} ${route} ${args}`()
        break
      case 'echo':
        await console.echo(args.join(' ').trim())
        break
      case 'throw':
        throw new Error('This is an error thrown for testing.')
      default:
        this.emit('failure', `Invalid command: ${command}`)
    }
  }
}
