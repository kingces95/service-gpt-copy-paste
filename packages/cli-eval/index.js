#!/usr/bin/env node

import { Cli } from '@kingjs/cli'
import { spawn } from 'child_process'

class CliEval extends Cli {
  static description = 'Evaluate a shell command'
  static descriptions = {
    exe: 'The command to execute',
    args: 'Arguments for the command',
    shell: 'The shell to use'
  }
  static choices = {
    shell: [ 'bash', 'cmd.exe' ]
  }
  static meta = CliEval.load()

  constructor(exe, args = [], { shell, ...rest } = { }) {
    if (Cli.isLoading(arguments) || CliEval.saveDefaults(exe, args, { shell }))
      return super(Cli.loading)
    
    super(rest)
    this.args = args
    this.command = exe

    // Launch the shell command
    const child = spawn(this.command, args, {
      shell,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    // Handle piping streams
    this.stdin.pipe(child.stdin)
    child.stdout.pipe(this.stdout)
    child.stderr.pipe(this.stderr)
    
    // Handle abort signal
    process.on('SIGINT', () => {
      child.kill('SIGINT')
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

class CliEvalBash extends CliEval {
  static description = 'Evaluate a bash shell command'
  static meta = CliEvalBash.load()
  
  constructor(...args) {
    if (Cli.isLoading(arguments) || CliEvalBash.saveDefaults({ }))
      return super(Cli.loading)

    this.verify(CliEvalBash, ...args)
    super(...args, { shell: 'bash' })
  }
}

class CliEvalCmd extends CliEval {
  static description = 'Evaluate a cmd shell command'
  static meta = CliEvalCmd.load()
  
  constructor(...args) {
    if (Cli.isLoading(arguments) || CliEvalCmd.saveDefaults({ }))
      return super(Cli.loading)

    super(...args, { shell: 'cmd.exe' })
  }
}

export { 
  CliEvalBash as CliBashEval, 
  CliEvalCmd as CliCmdEval, 
  CliEval 
}

// CliEval.__dumpLoader()
