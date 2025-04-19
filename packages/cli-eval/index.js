import { CliTerminal } from '@kingjs/cli-terminal'
import { CliService } from '@kingjs/cli-service'

export class CliEvalState extends CliService { 
  static consumes = [ 'beforeSpawn', 'beforeJoin' ]
  static produces = [ 'is' ]
  static { this.initialize(import.meta) }

  #code

  constructor(options) { 
    if (CliEvalState.initializing(new.target)) 
      return super()
    super(options)

    this.once('beforeSpawn', () => this.emit('is', 'spawning'))
    this.once('beforeJoin', (code) => {
      this.#code = code
      this.emit('is', 'joining', this.toString())
    })
  }

  toString() {
    if (this.#code) return `Shell command failed (code=${this.#code}).`
    return `Shell command completed successfully.`
  }
}

export class CliEval extends CliTerminal {
  static description = 'Evaluate a shell command'
  static choices = {
    shell: [ 'bash', 'cmd', 'wsl', 'ps' ],
  }
  static parameters = {
    shell: 'The shell to use',
    exe: 'The command to execute',
    args: 'Arguments for the command',
  }
  static produces = [ 'beforeSpawn', 'beforeJoin' ]
  static { this.initialize(import.meta) }

  static bash(...args) { return [ 'bash', '-c', args.join(' ') ] }
  static cmd(...args) { return [ 'cmd', '/c', args.join(' ') ] }
  static wsl(...args) { return CliEval.cmd('wsl', ...args) }
  static ps(...args) { return CliEval.cmd('powershell', '-Command', ...args) }

  #shell
  #args
  #exe

  constructor(shell, exe, args = [], options = { }) {
    if (CliEval.initializing(new.target, shell, exe, args))
      return super()
    super(options)

    this.#shell = shell
    this.#args = args
    this.#exe = exe
  }

  async run(shell) {
    let fn = CliEval[this.#shell]
    const [exe, ...args] = fn(this.#exe, ...this.#args)
    this.emit('beforeSpawn')
    const result = await shell.spawn(exe, args)()
    this.emit('beforeJoin', result)
  }
}

// CliEval.__dumpMetadata()
