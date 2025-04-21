import { AbortError } from '@kingjs/abort-error'
import { Functor } from '@kingjs/functor'

export class CliSubshell extends Functor {
  static fromArgs(shell, cmd, args) {
    return new CliCommandSubshell({ shell, cmd, args })
  }

  static fromFn(shell, fn) {
    return new CliFunctionSubshell({ shell, fn })
  }

  #shell
  #children

  constructor(shell) {
    super(function() { return this.$(...arguments) })
    this.#shell = shell
    this.#children = []
  }

  get shell() { return this.#shell }
  get signal() { return this.#shell.signal }
  get cwd() { return this.#shell.cwd }
  get stdio() { return this.#shell.stdio }
  get env() { return this.#shell.env }

  $() {
    if (arguments.length == 0) {
      const promises = [this.spawn(), ...this.#children.map(child => child())]
      return Promise.all(promises).then(result => result.flat())
    }

    const [arg0, arg1, ...rest] = arguments
    if (typeof arg0 === 'string') {
      this.stdio.redirect( 
        // ('hello', 'world'); like here-doc
        typeof arg1 == 'string' ? [arg0, arg1, ...rest] 

        // ('hello world'); like here-string
        : arg0
      )

    } else {
      const { vars, ...redirections } = arg0 ?? { }
      
      // ({ stdout: 'file.txt' }); like file redirect
      this.#children.push(...this.stdio.redirect(redirections))

      // ({ IFS=',' }); like private env var
      if (vars) {
        for (const [key, value] of Object.entries(vars))
          this.env[key] = value
      }
    }

    return this
  }
}

class CliFunctionSubshell extends CliSubshell {
  #fn

  constructor({ shell, fn }) {
    super(shell)
    this.#fn = fn
  }

  get fn() { return this.#fn }

  async spawn() {
    const { shell } = this

    // (); execute in-process subshell
    const result = this.#fn(shell)

    if (result && typeof result[Symbol.asyncIterator] === 'function') {
      for await (const item of result) {
        if (Buffer.isBuffer(item)) {
          shell.stdout.write(item.toString())
        } else {
          shell.stdout.write(item)
          shell.stdout.write('\n')
        }
      }
    } else if (typeof result === 'string') {
      this.stdio.write(result)
      shell.stdout.write('\n')
    }
  }
}

class CliCommandSubshell extends CliSubshell {
  #cmd
  #args

  constructor({ shell, cmd, args }) {
    super(shell)
    this.#cmd = cmd
    this.#args = args
  }

  #flatEnv() { 
    const result = {}
    for (const key in this.env) {
      const value = this.env[key]
      if (typeof value === 'string') {
        result[key] = value
      }
    }
    return result
  }

  get cmd() { return this.#cmd }
  get args() { return this.#args }

  spawn() {
    // (); execute command
    return new Promise((accept, reject) => {
      const env = this.#flatEnv()
      const { cmd, args, stdio, signal, cwd } = this
      const child = stdio.spawn(cmd, args, { env, cwd })

      // propagate SIGINT as SIGINT instead of SIGTERM to child process
      // signal.addEventListener('abort', () => child.kill('SIGINT'))

      // take responsibility for child process termination
      // process.on('exit', () => child.kill('SIGTERM'))

      let result = { }
      child.on('error', reject)
      child.on('exit', (code, signal) => (result = { code, signal }))
      child.on('close', () => {
        const { signal, code } = result
        if (signal == 'SIGINT') return reject(new AbortError('CliShell'))
        // TODO: failures should include a log dump; revisit once we have a logger
        if (signal) reject(new Error(`Child process killed by signal: ${signal}`))
        accept(code)
      })
    })
  }
}