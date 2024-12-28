#!/usr/bin/env node

import { Cli } from '@kingjs/cli'
import { CliShim } from '@kingjs/cli-loader'
import { spawn } from 'child_process'

class CliShell extends Cli {
  static metadata = Object.freeze({
    command: '<command> [args...]',
    description: 'Run a shell command',
    arguments : {
      command: { describe: 'The command to execute', type: 'string', demandOption: true },
      args: { describe: 'Arguments for the command', type: 'array', default: [] }
    },
  })

  constructor({ shell, command, args, signal }) {
    super()

    this.args = args
    this.command = command

    // Launch the shell command
    const child = spawn(command, args, {
      shell,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    // Handle piping streams
    this.stdin.pipe(child.stdin)
    child.stdout.pipe(this.stdout)
    child.stderr.pipe(this.stderr)
    
    // Handle abort signal
    signal.addEventListener('abort', () => {
      if (!child.killed) {
        child.kill('SIGINT')
      }
    })
    
    // Handle process events
    child.on('exit', (code, signal) => this.exit$(code, signal))
    child.on('close', () => this.$close())
    child.on('error', (err) => this.error$(err))
    
    // Handle status update
    setTimeout(() => this.is$('processing'))
  }

  toString(state, result, ...rest) {
    if (Cli.isSuccess(state, result, ...rest))
      return `Shell command '${this.command}' completed successfully`

    if (Cli.isFailure(state, result, ...rest))
      return `Shell command '${this.command}' exited with code ${result}`

    if (Cli.isAborted(state, result, ...rest)) {
      const [ signal ] = rest
      return `Shell command '${this.command}' aborted due to ${signal}`
    }

    return super.toString(state, result, ...rest)
  }
}

class CliBashShell extends CliShell {
  static metadata = Object.freeze({
    description: 'Run a bash shell command',
  })
  
  constructor(args) {
    super({ shell: 'bash', ...args })
  }
}

class CliCmdShell extends CliShell {
  static metadata = Object.freeze({
    description: 'Run a cmd shell command',
  })
  
  constructor(args) {
    super({ shell: 'cmd.exe', ...args })
  }
}

export { CliBashShell, CliCmdShell, CliShell }
