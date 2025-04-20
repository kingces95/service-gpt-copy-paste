import { CliSubshell } from '@kingjs/cli-subshell'
import { CliShellStdio } from '@kingjs/cli-shell-stdio'
import { PassThrough } from 'stream'
import { Functor } from '@kingjs/functor'

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

  constructor({ 
    signal, 
    env = Object.create(process.env), 
    stdio = new CliShellStdio(),
    alias = new Map(),
  } = { }) {
    super(function() { return this.$(...arguments) })
    this.#signal = signal
    this.#env = env
    this.#stdio = stdio
    this.#pushdStack = [env.PWD || process.cwd()]
    this.#alias = alias
  }

  get signal() { return this.#signal }
  get env() { return this.#env }
  get stdio() { return this.#stdio }
  get alias() { return this.#alias }
  
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
