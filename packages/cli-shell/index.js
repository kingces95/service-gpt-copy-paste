import { CliSubshell } from '@kingjs/cli-subshell'
import { CliStdio } from '@kingjs/cli-stdio'
import { Functor } from '@kingjs/functor'
import { CliReader, CliParser } from '@kingjs/cli-reader'
import { CliWriter } from '@kingjs/cli-writer'
import { Lazy } from '@kingjs/lazy'

function parseCommand(strings = [], values = []) {
  const result = []

  for (let i = 0; i < strings.length; i++) {
    const raw = strings[i].trim()
    if (raw.length > 0)
      result.push(...raw.split(/\s+/))

    if (i < values.length) {
      const value = values[i]

      if (Array.isArray(value)) {
        for (const element of value) {
          result.push(String(element))
        }
      } else {
        result.push(String(value))
      }
    }
  }

  return result
}

export class CliShell extends Functor {

  #signal
  #env
  #stdio
  #pushdStack
  #alias
  #reader
  #writer
  
  constructor({ 
    signal, 
    env = Object.create(process.env), 
    stdio = new CliStdio(),
    alias = new Map(),
  } = { }) {
    super(function() { return this.$(...arguments) })
    this.#signal = signal
    this.#env = env
    this.#stdio = stdio
    this.#pushdStack = [env.PWD || process.cwd()]
    this.#alias = alias

    this.#reader = new Lazy(() => new CliReader(this.stdin, new CliParser()))
    this.#writer = new Lazy(() => new CliWriter(this.stdout))
  }

  get signal() { return this.#signal }
  get env() { return this.#env }
  get stdio() { return this.#stdio }
  get alias() { return this.#alias }
  get reader() { return this.#reader.value }
  get writer() { return this.#writer.value }
  get stdin() { return this.#stdio.getStream(0) }
  get stdout() { return this.#stdio.getStream(1) }
  get stderr() { return this.#stdio.getStream(2) }

  [Symbol.asyncIterator]() { return this.reader[Symbol.asyncIterator]() }

  async readByte(signal) { return await this.reader.readByte(signal) }
  async readString(charCount, signal) { 
    return await this.reader.readString(charCount, signal) 
  }
  async readChar(signal) { return await this.reader.readChar(signal) }
  async read(signal) { return await this.reader.read(signal) }
  async readArray(signal) { return await this.reader.readArray(signal) }
  async readRecord(fields, signal) { 
    return await this.reader.readRecord(fields, signal) 
  }

  async echo(line) { await this.writer.echo(line) }
  async echoRecord(fields, separator = ' ') {
    await this.writer.echoRecord(fields, separator)
  }
  
  get cwd() { return this.#pushdStack[this.#pushdStack.length - 1] }
  pushd(path) { this.#pushdStack.push(path) }
  popd() { return this.#pushdStack.pop() }

  #copy() {
    const env = Object.create(this.#env)
    const stdio = this.#stdio.copy()
    const alias = new Map(this.#alias)
    const { signal } = this
    return new CliShell({ signal, env, stdio, alias })
  }

  #parseCommand(strings, values) {
    return this.expand(...parseCommand(strings, values))
  }

  expand(cmd, ...rest) {
    const alias = this.#alias.get(cmd)
    if (alias) return alias(...rest)
    return arguments
  }
  
  spawn(cmd, ...args) {
    return CliSubshell.fromArgs(this.#copy(), cmd, args)
  }

  subshell() {
    const [ arg0 ] = arguments
    if (!arg0) return
    
    if (arg0 instanceof CliSubshell) 
      return arg0

    if (typeof arg0 === 'string')
      return this.spawn(...this.expand(...arg0.split(/\s+/)))

    if (arg0 instanceof Function)
      return CliSubshell.fromFn(this.#copy(), arg0)

    throw new Error([
      `Invalid subshell type: ${arg0.constructor.name}.`,
      `Expected string, function, or CliSubshell.`].join(' '))
  }

  pipeline(...subshells) {
    const last = subshells.pop()
    return subshells.reverse().reduce((last, previous) => {
      return this.subshell(previous)({ stdout: last })
    }, this.subshell(last))
  }

  // command string: e.g. echo "hello"
  $() {
    const [ arg0 ] = arguments

    // command string: e.g. echo $`my-cmd ${arg0} ${arg1}`
    if (Array.isArray(arg0)) {
      const [strings, values] = arguments
      return this.spawn(...this.#parseCommand(strings, values))
    }

    // pipeline: e.g. $($'a', ..., $ => { ... }, ...)
    return this.pipeline(...arguments)
  }
}
