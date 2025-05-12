import { CliStdioLoader } from '@kingjs/cli-stdio-loader'
import { CliSubshell } from '@kingjs/cli-subshell'
import { Functor } from '@kingjs/functor'
import { CliReader } from '@kingjs/cli-reader'
import { CliParser } from '@kingjs/cli-parser'
import { CliWriter } from '@kingjs/cli-writer'
import { Lazy } from '@kingjs/lazy'
import { 
  CliBorrowedReadableResource,
  CliBorrowedWritableResource,
} from '@kingjs/cli-resource'
import path from 'path'

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

function createAndExtend(target, extension) {
  const result = Object.create(target)
  for (const [key, value] of Object.entries(extension))
    result[key] = value
  return result
}

export class CliShell extends Functor {
  #signal
  #env
  #pushdStack
  #alias
  #loader
  #slots
  #reader
  #writer
  #__subshellId = 0
  
  constructor({ 
    parent = null,
    vars = {},
    redirects = [],
    signal = parent?.signal, 
    cwd = parent?.cwd ?? process.cwd(),
    loader = parent?.loader ?? new CliStdioLoader(),
    alias = parent ? new Map(parent.alias) : new Map(),
    env = createAndExtend(parent?.env ?? process.env, vars), 
    slots = createAndExtend(parent?.slots ?? [ 
      new CliBorrowedReadableResource(process.stdin,  { __name: 'stdin' }), 
      new CliBorrowedWritableResource(process.stdout, { __name: 'stdout' }), 
      new CliBorrowedWritableResource(process.stderr, { __name: 'stderr' }), 
    ], redirects),
  } = { }) {
    super()
    this.#loader = loader
    this.#signal = signal
    this.#pushdStack = [cwd]
    this.#alias = alias
    this.#env = env
    this.#slots = slots

    const { ifs } = env
    this.#reader = new Lazy(() => new CliReader(this.stdin, new CliParser(ifs)))
    this.#writer = new Lazy(() => new CliWriter(this.stdout))
  }

  #parseCommand(strings, values) {
    return this.expand(...parseCommand(strings, values))
  }

  #builtin(fn, ...args) {
    return CliSubshell.fromBuiltin(this, shell => fn(shell, ...args))
  }

  __getSubshellId() { return this.#__subshellId++ }

  getStream(slotOrName) {
    const { loader, slots } = this

    // resolve well-known names to slots
    const slot = loader.getSlot(slotOrName)
    if (slot == null) 
      throw new TypeError(`Invalid slot or stream name: ${slotOrName}`)

    // resolve well-known fds to streams
    const stream = slots[slot]?.stream
    if (!stream) {
      const stream = slots[slot]?.stream
      throw new TypeError(`Invalid stream: ${stream}`)
    }

    return stream
  }
  get stdin() { return this.getStream('stdin') }
  get stdout() { return this.getStream('stdout') }
  get stderr() { return this.getStream('stderr') }

  get cwd() { return this.#pushdStack[this.#pushdStack.length - 1] }
  pushd(path) { this.#pushdStack.push(path) }
  popd() { return this.#pushdStack.pop() }
  resolve(relativePath) { return path.resolve(this.cwd, relativePath) }

  get signal() { return this.#signal }
  get env() { return this.#env }
  get alias() { return this.#alias }
  get loader() { return this.#loader }
  get slots() { return this.#slots }
  get reader() { return this.#reader.value }
  get writer() { return this.#writer.value }

  [Symbol.asyncIterator]() { return this.reader[Symbol.asyncIterator]() }

  readByte() { 
    return this.#builtin($ => $.reader.readByte($.signal))
  }
  readString(charCount) { 
    return this.#builtin($ => $.reader.readString(charCount, $.signal))
  }
  readChar() { 
    return this.#builtin($ => $.reader.readChar($.signal))
  }
  read() { 
    return this.#builtin($ => $.reader.read($.signal))
  }
  readArray() { 
    return this.#builtin($ => $.reader.readArray($.signal))
  }
  readRecord(fields) { 
    return this.#builtin($ => $.reader.readRecord(fields, $.signal))
  }

  echo(line) { 
    return this.#builtin($ => $.writer.echo(line))
  }
  echoRecord(fields, separator = ' ') {
    return this.#builtin($ => $.writer.echoRecord(fields, separator))
  }

  scope(vars) {
    return new CliShell({ parent: this, vars })
  }
  
  expand(cmd, ...rest) {
    const alias = this.#alias.get(cmd)
    if (alias) return alias(...rest)
    return arguments
  }
  
  spawn(cmd, ...args) {
    return CliSubshell.fromArgs(this, cmd, args)
  }

  pipeline(...stages) {
    const firstStage = this.subshell(stages.shift())
    stages.reduce((current, next) => {
      const nextStage = this.subshell(next)
      current({ stdout: nextStage })
      return nextStage
    }, firstStage)
    return firstStage
  }

  subshell() {
    const [ arg0, arg1 ] = arguments
    if (!arg0) return
    
    if (arg0 instanceof CliSubshell) 
      return arg0

    if (typeof arg0 === 'string')
      return this.spawn(...this.expand(...arg0.split(/\s+/)))

    if (arg0 instanceof Function) {
      const [ fn, context ] = [ arg0, arg1 ]
      return CliSubshell.fromFn(this, shell => {
        return fn.call(context, shell)
      })
    }

    throw new Error([
      `Invalid subshell type: ${arg0.constructor.name}.`,
      `Expected string, function, or CliSubshell.`].join(' '))
  }

  // command string: e.g. echo "hello"
  $() {
    const [ arg0 ] = arguments

    // command string: e.g. echo $`my-cmd ${arg0} ${arg1}`
    if (Array.isArray(arg0)) {
      const [strings, ...values] = arguments
      return this.spawn(...this.#parseCommand(strings, values))
    }

    // ({ IFS=',' })(...); like private env var
    if (arg0 && arg0.constructor === Object) 
      return this.scope(arg0)

    // pipeline: e.g. $($'a', ..., $ => { ... }, ...)
    return this.pipeline(...arguments)
  }

  $$() {
    const subshell = this.$(...arguments)
    return subshell({ stdin: null })
  }

  async dispose() {
    for (const resource of Object.values(this.#slots))
      await resource.dispose()
  }
}
