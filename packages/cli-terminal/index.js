import { CliCommand } from '@kingjs/cli-command'
import { CliShell } from '@kingjs/cli-shell'

export class CliTerminal extends CliCommand {
  static produces = [ 'beforeStart', 'beforeStop' ]
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliTerminal.initializing(new.target)) 
      return super()
    super(options)
  }

  async execute(signal) {
    const shell = new CliShell({ signal })
    shell.alias.set('this', (...args) => {
        const [ node, cmd ] = process.argv
        return [ node, cmd, ...args ]
    })
    await this.run(shell)
  }

  async run(shell) { }
}

// CliShell.__dumpMetadata()
