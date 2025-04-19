import { AbortError } from '@kingjs/abort-error'
import assert from 'assert'

export class CliSubshell {
  static fromArgs(shell, cmd, args) {
    const command = new CliCommandSubshell({ shell, cmd, args })
    return command.spawn.bind(command)
  }

  static fromFn(shell, fn) {
    const command = new CliFunctionSubshell({ shell, fn })
    return command.spawn.bind(command)
  }

  #shell
  #children

  constructor(shell) {
    this.#shell = shell
    this.#children = []
  }

  get shell() { return this.#shell }
  get signal() { return this.#shell.signal }
  get cwd() { return this.#shell.cwd }
  get shellInfo() { return this.#shell.shellInfo }
  get stdio() { return this.#shell.stdio }
  get env() { return this.#shell.env }

  redirect() {
    if (arguments.length == 0) return false

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

    return true
  }

  spawn() { 
    return this.#children.map(child => child()) 
  }
}

export class CliFunctionSubshell extends CliSubshell {
  #fn

  constructor({ shell, fn }) {
    super(shell)
    this.#fn = fn
  }

  get fn() { return this.#fn }

  spawn() {
    if (this.redirect(...arguments)) {
      // redirect was called; return a function to execute later
      return this.spawn.bind(this)
    }

    // execute child subshells which are piping in or out of this subshell
    const children = super.spawn()

    // (); execute in-process subshell
    return this.#fn(this.shell)
      .then(async result => {
        // await for all children to finish
        await Promise.all(children)
        return result
      })
  }
}

export class CliCommandSubshell extends CliSubshell {
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
    if (this.redirect(...arguments)) {
      // redirect was called; return a function to execute later
      return this.spawn.bind(this)
    }

    // execute child subshells which are piping in or out of this subshell
    const children = super.spawn()

    // (); execute command
    return new Promise((accept, reject) => {
      const shell = this.shellInfo.name
      const env = this.#flatEnv()
      const { cmd, args, stdio, signal, cwd } = this
      const child = stdio.spawn(cmd, args, { env, cwd, shell })

      // propagate SIGINT as SIGINT instead of SIGTERM to child process
      signal.addEventListener('abort', () => child.kill('SIGINT'))

      // take responsibility for child process termination
      process.on('exit', () => child.kill('SIGTERM'))

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
    }).then(async result => {
      // await for all children to finish
      await Promise.all(children)
      return result 
    })
  }
}