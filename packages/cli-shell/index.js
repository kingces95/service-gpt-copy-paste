import { CliStdioLoader } from '@kingjs/cli-stdio-loader'
import { CliSubshell } from '@kingjs/cli-subshell'
import { Functor } from '@kingjs/functor'
import { CliReader } from '@kingjs/cli-reader'
import { CliWriter } from '@kingjs/cli-writer'
import { isPojo } from '@kingjs/pojo-test'
import { Path } from '@kingjs/path'
import { Lazy } from '@kingjs/lazy'
import { 
  CliBorrowedReadableResource,
  CliBorrowedWritableResource,
} from '@kingjs/cli-resource'

export const DISPOSE_TIMEOUT_MS = 1000

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
    pushdStack = parent ? [...parent.dirs] : [ Path.create(process.cwd()) ],
    loader = parent?.loader ?? new CliStdioLoader(),
    alias = parent ? new Map(parent.alias) : new Map(),
    env = createAndExtend(parent?.env ?? process.env, vars), 
    slots = createAndExtend(parent?.slots ?? [ 
      new CliBorrowedReadableResource(process.stdin,  { __name: 'stdin' }), 
      new CliBorrowedWritableResource(process.stdout, { __name: 'stdout' }), 
      new CliBorrowedWritableResource(process.stderr, { __name: 'stderr' }), 
    ], redirects),
  } = { }) {
    if (!signal) throw new TypeError('signal is required')

    super()
    this.#loader = loader
    this.#signal = signal
    this.#pushdStack = pushdStack
    this.#alias = alias
    this.#env = env
    this.#disposeTimeoutMs = disposeTimeoutMs
    this.#slots = slots
    this.#reader = new Lazy(() => new CliReader(this.stdin))
    this.#writer = new Lazy(() => new CliWriter(this.stdout))
  }

  #pipeline(subshells) {
    const last = subshells.pop()

    subshells.reverse().reduce((consumer, producer) => {
      consumer({ stdin: producer })
      return producer
    }, last)
    
    return last({ then: result => result.reverse() })
  }

  #builtin(fn, ...args) {
    return CliSubshell.fromBuiltin(this, shell => fn(shell, ...args))
  }

  __getSubshellId() { return this.#__subshellId++ }

  get loader() { return this.#loader }
  get signal() { return this.#signal }
  get env() { return this.#env }
  get alias() { return this.#alias }
  get slots() { return [...this.#slots] }
  get disposeTimeoutMs() { return this.#disposeTimeoutMs }

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
    return this.#pushdStack[0] 
  }
  get dirs() {
    return [...this.#pushdStack]
  }
  pushd(dir) {
    this.#pushdStack.unshift(this.cwd(dir))
    return this.cwd
  }
  popd() {
    if (this.#pushdStack.length > 1) 
      this.#pushdStack.shift() 
    return this.cwd
  }

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
  
  expand(cmd, ...rest) {
    const alias = this.#alias.get(cmd)
    if (alias) return alias(...rest)
    return [...arguments]
  }
  
  spawn(cmd, ...args) {
    const [ cmd$, ...args$ ] = this.expand(cmd, ...args)
    return CliSubshell.fromArgs(this, cmd$, args$)
  }

  call$(...args) {
    // bash idioms mapped to overloads:
    //  $ my-cmdOrFn arg0 arg1 arg2 ...
    //  $ my-cmdOrFn | my-cmdOrFn | ...
    //  $ MY_VAR=42 my-cmdOrFn
    //  $ MY_VAR=42 (my-cmdOrFn | my-cmdOrFn | ...)

    const [ arg0 ] = args
    
    // $`my-cmd ${var0} ${var1}`
    if (Array.isArray(arg0)) {
      const [strings, ...values] = args
      return this.spawn(...parseCommand(strings, values))
    }
    
    // overload examples without private variables:
    //  $()
    //  $($ => { })
    //  $($`my-cmd`)
    //  $($ => { }, $ => { }, ...)
    //  $($`my-cmd`, $`my-cmd`, ...)
    //  $($ => { }, $`my-cmd`, ...)

    // overload examples with private variables:
    //  $({ IFS=',' })
    //  $({ IFS=',' }, $ => { })
    //  $({ IFS=',' }, $`my-cmd`)
    //  $({ IFS=',' }, $ => { }, $ => { }, ...)
    //  $({ IFS=',' }, $`my-cmd`, $`my-cmd`, ...)
    //  $({ IFS=',' }, $ => { }, $`my-cmd`, ...)
    const hasVars = isPojo(arg0)
    const vars = hasVars ? arg0 : null
    const subshellOrFns = hasVars ? args.slice(1) : args
    const subshells = subshellOrFns
      .map(subshellOrFn => {
        if (subshellOrFn instanceof SubShell) 
          return subshellOrFn(vars)
        
        if (subshellOrFn instanceof Function)
          return CliSubshell.fromFn(this, subshellOrFn, vars)

        throw new Error('Invalid subshell type: '
          + subshellOrFn?.constructor?.name)
      })
      .map(subshell => subshell(vars))

    // $()
    // $(vars)
    if (subshells.length == 0)
      return new CliShell({ parent: this, vars })

    // $(subshellOrFn)
    // $(vars, subshellOrFn)
    if (subshells.length == 1) 
      return subshells[0]

    // $(subshellOrFn, subshellOrFn, ...)
    // $(vars, subshellOrFn, subshellOrFn, ...)
    return this.#pipeline(subshells)
  }

  async dispose() {
    for (const resource of Object.values(this.#slots)) {
      const abortController = new AbortController()
      setTimeout(() => abortController.abort(), this.#disposeTimeoutMs)
      await resource.dispose(abortController.signal)
    }
  }
}
