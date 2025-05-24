import { CliCommand } from '@kingjs/cli-command'
import { CliShell } from '@kingjs/cli-shell'

export const DEFAULT_IFS = ' '

export class CliTerminal extends CliCommand {
  static parameters = {
    ifs: 'Input field separator',
    pwd: 'Current working directory',
    stdin: 'Standard input',
    stdout: 'Standard output',
    stderr: 'Standard error',
    stdmon: 'Standard monitor',
  }
  static consumes = [ 'beforeStart', 'beforeStop' ]
  static produces = [ 'is' ]
  static { this.initialize(import.meta) }

  #ifs
  #pwd
  #stdin
  #stdout
  #stderr
  #stdmon

  constructor({ 
    ifs = null, 
    pwd = null,
    stdin = null,
    stdout = null,
    stderr = null,
    stdmon = null,
    ...rest } = { }) {
    if (CliTerminal.initializing(new.target, { 
      ifs, pwd, stdin, stdout, stderr, stdmon }))
      return super()
    super(rest)

    this.#ifs = ifs || process.env[ 'IFS' ] || DEFAULT_IFS
    this.#pwd = pwd || process.cwd()
    this.#stdin = stdin  
    this.#stdout = stdout
    this.#stderr = stderr

    this.once('beforeStart', () => this.emit('is', 'starting'))
    this.once('beforeStop', () => this.emit('is', 'stopping'))
  }

  get ifs() { return this.#ifs }
  get pwd() { return this.#pwd }
  get stdin() { return this.#stdin }
  get stdout() { return this.#stdout }
  get stderr() { return this.#stderr }
  get stdmon() { return this.#stdmon }
  
  async execute(signal) {
    const { pwd } = this
    const $ = new CliShell({ signal, pushdStack: [ pwd ] })

    $.alias.set('this', (...args) => {
      const [ node, cmd ] = process.argv
      return [ node, cmd, ...args ]
    })

    try {
      this.emit('beforeStart')
      const { ifs, stdin, stdout, stderr, stdmon } = this
      const vars = { ifs }
      const subshell = $(vars)(this.run.bind(this))
      const redirect = subshell({ stdin, stdout, stderr })
      const result = await redirect
      return result[0]
    } finally {
      this.emit('beforeStop')
    }
  }

  async run(shell) { }
}
