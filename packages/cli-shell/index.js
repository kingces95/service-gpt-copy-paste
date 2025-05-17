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

const DISPOSE_TIMEOUT_MS = 1000

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
  #disposeTimeoutMs
  #__subshellId = 0
  
  constructor({ 
    parent = null,
    vars = {},
    redirects = [],
    signal = parent?.signal, 
    disposeTimeoutMs = parent?.disposeTimeoutMs ?? DISPOSE_TIMEOUT_MS,
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
    this.#disposeTimeoutMs = disposeTimeoutMs

    const { ifs } = env
    this.#reader = new Lazy(() => new CliReader(this.stdin, new CliParser(ifs)))
    this.#writer = new Lazy(() => new CliWriter(this.stdout))
  }

  #builtin(fn, ...args) {
    return CliSubshell.fromBuiltin(this, shell => fn(shell, ...args))
  }

  #pipeline(stages) {
    const last = stages.pop()
    stages.reverse().reduce((consumer, producer) => {
      consumer({ stdin: producer })
      return producer
    }, last)
    
    return last({ then: result => result.reverse() })
  }

  __getSubshellId() { return this.#__subshellId++ }

  getStream(slotOrName) {
    const { loader, slots } = this

    // resolve well-known names to slots
    const slot = loader.getSlot(slotOrName)
    if (slot == null) 
      throw new TypeError(`Invalid slot or stream name: ${slotOrName}`)

    // resolve well-known fds to streams
    return slots[slot]?.stream
  }
  get stdin() { return this.getStream('stdin') }
  get stdout() { return this.getStream('stdout') }
  get stderr() { return this.getStream('stderr') }

  get cwd() { 
    return this.#pushdStack[this.#pushdStack.length - 1] 
  }
  get dirs() {
    return [...this.#pushdStack].reverse()
  }
  pushd(dir) { 
    this.#pushdStack.push(this.resolve(dir))
  }
  popd() { 
    if (this.#pushdStack.length > 1) 
      this.#pushdStack.pop() 
    return this.cwd
  }
  resolve() { 
    return path.resolve(this.cwd, ...arguments) 
  }

  get env() { return this.#env }
  get alias() { return this.#alias }

  get signal() { return this.#signal }
  get loader() { return this.#loader }
  get slots() { return this.#slots }
  get reader() { return this.#reader.value }
  get writer() { return this.#writer.value }

  [Symbol.asyncIterator]() { 
    return this.reader[Symbol.asyncIterator]() 
  }

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
    return [...arguments]
  }
  
  spawn(cmd, ...args) {
    const [ cmd$, ...args$ ] = this.expand(cmd, ...args)
    return CliSubshell.fromArgs(this, cmd$, args$)
  }

  subshell(value) {
    if (!value) return
    
    if (value instanceof CliSubshell) 
      return value

    if (value instanceof Function)
      return CliSubshell.fromFn(this, value)

    throw new Error([
      `Invalid subshell type: ${value.constructor.name}.`,
      `Expected string, function, or CliSubshell.`].join(' '))
  }

  pipeline(...stages) {
    return this.#pipeline(stages.map(stage => this.subshell(stage)))
  }

  // command string: e.g. echo "hello"
  $() {
    const [ arg0 ] = arguments

    if (arg0 == null) return

    // ({ IFS=',' })(...); like private env var
    if (arg0.constructor === Object) 
      return this.scope(arg0)

    // command string: e.g. echo $`my-cmd ${arg0} ${arg1}`
    if (Array.isArray(arg0)) {
      const [strings, ...values] = arguments
      return this.spawn(...parseCommand(strings, values))
    }

    // pipeline: e.g. $($'a', ..., $ => { ... }, ...)
    return this.pipeline(...arguments)
  }

  async dispose() {
    for (const resource of Object.values(this.#slots)) {
      const abortController = new AbortController()
      setTimeout(() => abortController.abort(), this.#disposeTimeoutMs)
      await resource.dispose(abortController.signal)
    }
  }
}
