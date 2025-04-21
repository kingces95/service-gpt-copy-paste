import { CliCommand } from '@kingjs/cli-command'
import { CliShell } from '@kingjs/cli-shell'
import { CliStdio } from '@kingjs/cli-stdio'
import { STDOUT_FD, STDERR_FD } from '@kingjs/cli-writable'
import { STDIN_FD } from '@kingjs/cli-readable'

export class CliTerminal extends CliCommand {
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliTerminal.initializing(new.target)) 
      return super()
    super(options)
  }
  
  async execute(signal) {
    const slots = [ STDIN_FD, STDOUT_FD, STDERR_FD ]
    const stdio = new CliStdio({ slots })
    const shell = new CliShell({ signal, stdio })

    shell.alias.set('this', (...args) => {
      const [ node, cmd ] = process.argv
      return [ node, cmd, ...args ]
    })

    await this.run(shell)
  }

  async run(shell) { }
}

// CliShell.__dumpMetadata()
