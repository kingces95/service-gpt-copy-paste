#!/usr/bin/env node

import { Cli } from '@kingjs/cli'
import { spawn } from 'child_process'

class CliEval extends Cli {
  static metadata = Object.freeze({
    description: 'Evaluate a shell command',
    arguments : [
      { name: 'exe', description: 'The command to execute', type: 'string', demandOption: true },
      { name: 'args', description: 'Arguments for the command', type: 'array', default: [] }
    ],
  })

  constructor({ shell, exe: command, args, signal }) {
    super({ signal })

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
    child.on('exit', (code, signal) => this.done$(code, signal))
    child.on('close', () => this.$close())
    child.on('error', (err) => this.error$(err))
  }

  toString() {
    if (this.succeeded)
      return `Shell command '${this.command}' completed successfully`

    if (this.failed)
      return `Shell command '${this.command}' exited with code ${this.state$.data}`

    if (this.aborted)
      return `Shell command '${this.command}' aborted`

    return super.toString()
  }
}

class CliBashEval extends CliEval {
  static metadata = Object.freeze({
    description: 'Evaluate a bash shell command',
  })
  
  constructor(args) {
    super({ shell: 'bash', ...args })
  }
}

class CliCmdEval extends CliEval {
  static metadata = Object.freeze({
    description: 'Evaluate a cmd shell command',
  })
  
  constructor(args) {
    super({ shell: 'cmd.exe', ...args })
  }
}

export { CliBashEval, CliCmdEval, CliEval }
