import { CliShellInfo } from '@kingjs/cli-shell-info'
import { CliSubshell, CliCommandSubshell } from '@kingjs/cli-subshell'
import { CliShellStdio } from '@kingjs/cli-shell-stdio'
import { PassThrough } from 'stream'


function parseCommand(strings, values) {
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

export class CliShell {

  #signal
  #env
  #stdio
  #pushdStack
  #shellInfo
  #alias

  constructor({ 
    signal, 
    env = Object.create(process.env), 
    stdio = new CliShellStdio(),
    shellInfo = CliShellInfo.default,
    alias = {
      this: (...args) => {
        const [ node, cmd ] = process.argv
        return [ node, cmd, ...args ]
      },
    }
  } = { }) {
    this.#signal = signal
    this.#env = env
    this.#stdio = stdio
    this.#pushdStack = [env.PWD || process.cwd()]
    this.#shellInfo = shellInfo
    this.#alias = alias
  }

  get signal() { return this.#signal }
  get env() { return this.#env }
  get shellInfo() { return this.#shellInfo }
  get stdio() { return this.#stdio }
  
  get cwd() { return this.#pushdStack[this.#pushdStack.length - 1] }
  pushd(path) { this.#pushdStack.push(path) }
  popd() { return this.#pushdStack.pop() }

  #copy() {
    const env = Object.create(this.#env)
    const stdio = this.#stdio.copy()
    const alias = { ...this.#alias }
    const { signal, shellInfo } = this
    return new CliShell({ signal, env, stdio, shellInfo, alias })
  }

  #parseCommand(strings, values) {
    const [ strings0, ...rest ] = strings
    const split0 = strings0.split(' ')
    const [ cmd, ...rest0 ] = split0
    const alias = this.#alias[cmd]
    const args = parseCommand(
      alias ? [ rest0.join(' '), ...rest ] : strings, 
      values
    )
    return alias ? alias(...args) : args
  }
  
  #spawn(cmd, args = []) {
    return CliSubshell.fromArgs(this.#copy(), cmd, args)
  }

  subshell(fn = async (shell) => { }) {
    return CliSubshell.fromFn(this.#copy(), fn)
  }

  async pipeline(...subshells) {
    if (subshells.length == 0) return Promise.resolve()
    if (subshells.length == 1) return subshells[0]()
    const [ first, ...rest ] = subshells

    const results = []
    rest.reduce((prev, next) => {
      const middle = new PassThrough()
      results.push(prev({ stdout: middle })())
      return next({ stdin: middle })
    }, first)
    results.push(subshells.at(-1)())

    return await Promise.all(results)
  }

  // command string: e.g. echo "hello"
  $(strings, ...values) {
    const [cmd, ...args] = this.#parseCommand(strings, values)
    const [ shellCmd, ...shellArgs ] = this.#shellInfo.getArgs(cmd, args)
    return this.#spawn(shellCmd, shellArgs, this.#shellInfo.name)
  }
}
