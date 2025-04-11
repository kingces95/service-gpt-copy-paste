import { CliCommand } from '@kingjs/cli-command'
import { CliService } from '@kingjs/cli-service'
import { AbortError } from '@kingjs/abort-error'
import { CliStdOut } from '@kingjs/cli-std-stream'
import { LineEnding } from '@kingjs/line-ending'
import { pipeline } from 'stream/promises'
import { spawn } from 'child_process'

export class CliEvalState extends CliService { 
  static consumes = [ 'beforeSpawn', 'beforeJoin' ]
  static produces = [ 'is' ]
  static { this.initialize(import.meta) }

  #code
  #signal

  constructor(options) { 
    if (CliEvalState.initializing(new.target)) 
      return super()
    super(options)

    this.once('beforeSpawn', () => this.emit('is', 'spawning'))
    this.once('beforeJoin', (code, signal) => {
      this.#code = code
      this.#signal = signal
      this.emit('is', 'joining', this.toString())
    })
  }

  toString() {
    if (this.#code) return `Shell command failed (code=${this.#code}).`
    if (this.#signal == 'SIGINT') return `Shell command aborted.`
    return `Shell command completed successfully.`
  }
}

export class CliEval extends CliCommand {
  static description = 'Evaluate a shell command'
  static parameters = {
    exe: 'The command to execute',
    args: 'Arguments for the command',
    shell: 'The shell to use'
  }
  static services = {
    stdout: CliStdOut,
  }
  static commands = {
    bash: '@kingjs/cli-eval, CliEvalBash',
    cmd: '@kingjs/cli-eval, CliEvalCmd',
    ps: '@kingjs/cli-eval, CliEvalPs',
    wsl: '@kingjs/cli-eval, CliEvalWsl',
  }
  static produces = [ 'beforeSpawn', 'beforeJoin' ]
  static { this.initialize(import.meta) }

  #args
  #exe
  #shell
  #stdout

  constructor(exe, args = [], { shell, ...options } = { }) {
    if (CliEval.initializing(new.target, exe, args))
      return super()
    super(options)

    this.#args = args
    this.#exe = exe
    this.#shell = shell

    const { stdout } = this.getServices(CliEval)
    this.#stdout = stdout
  }

  async run(signal) {
    const child = spawn(this.#exe, this.#args, {
      shell: this.#shell,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    signal.addEventListener('abort', () => child.kill('SIGINT'), { once: true })
    
    const stdout = await this.#stdout
    const transform = { lineEnding: '\r\n' }
    pipeline(child.stdout, new LineEnding(transform), stdout, { signal })
    pipeline(child.stderr, new LineEnding(transform), process.stderr, { signal })
    
    const { code: exitCode } = await new Promise((resolve, reject) => {
      let result = { }
      child.on('error', reject)
      child.on('exit', (code, signal) => (result = { code, signal }))
      child.on('close', () => {
        if (result.signal == 'SIGINT') return reject(new AbortError())
        resolve(result)
      })
    })

    return exitCode
  }
}

export class CliEvalWsl extends CliEval {
  static description = 'Evaluate a shell command in the wsl'
  static { this.initialize(import.meta) }
  
  constructor(exe, args, options) {
    if (CliEvalWsl.initializing(new.target, { })) return super()
    super('wsl', [exe, ...args], { shell: 'cmd', ...options})
  }
}

export class CliEvalPs extends CliEval {
  static description = 'Evaluate a power shell command'
  static { this.initialize(import.meta) }
  
  constructor(exe, args, options) {
    if (CliEvalPs.initializing(new.target, { })) return super()
    super('powershell', ['-Command', exe, ...args], {  shell: 'cmd', ...options })
  }
}

export class CliEvalBash extends CliEval {
  static description = 'Evaluate a bash shell command'
  static { this.initialize(import.meta) }
  
  constructor(exe, args, options) {
    if (CliEvalBash.initializing(new.target, { })) return super()
    super(exe, args, { shell: 'bash', ...options})
  }
}

export class CliEvalCmd extends CliEval {
  static description = 'Evaluate a cmd shell command'
  static { this.initialize(import.meta) }
  
  constructor(exe, args, options) {
    if (CliEvalCmd.initializing(new.target, { })) return super()
    super(exe, args, { shell: 'cmd', ...options})
  }
}

// CliEval.__dumpMetadata()
