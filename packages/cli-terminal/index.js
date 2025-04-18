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
    await this.run(new CliShell({ signal }))
  }

  async run(shell) { }
}

// CliShell.__dumpMetadata()
