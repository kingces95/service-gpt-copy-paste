import { spawn } from 'child_process'
import { STDOUT_FD, STDERR_FD } from '@kingjs/cli-writable'
import { STDIN_FD } from '@kingjs/cli-readable'
import { Writable, Readable, Duplex, Stream } from 'stream'
import { CliReadable, DEV_NULL } from '@kingjs/cli-readable'
import { CliWritable } from '@kingjs/cli-writable'
import { PassThrough } from 'stream'

export class CliShellStdio {
  static DefaultStdioInfo = {
    stdin: { slot: 0, isInput: true },
    stdout: { slot: 1, isOutput: true },
    stderr: { slot: 2, isOutput: true },
  }
  
  static #activateInputRedirect(redirection) {
    // fd redirect; e.g. echo 0<&3
    if (redirection instanceof Readable) return redirection

    // path redirect; e.g. echo < file.txt
    if (redirection == null) redirection = DEV_NULL
    if (typeof redirection === 'string') return CliReadable.fromPath(redirection)

    // pipe input from output; e.g. echo <(echo 'hello world')
    if (typeof redirection === 'function') {
      const middle = new PassThrough()
      redirection({ stdout: middle })
      return middle
    }
    
    throw new TypeError(`Invalid input redirection: ${redirection}`)
  }

  static #activateOutputRedirect(redirection) {
    // fd redirect; e.g. echo 1>&3
    if (redirection instanceof Writable) return redirection
    
    // path redirect; e.g. echo > file.txt
    if (redirection == null) redirection = DEV_NULL
    if (typeof redirection === 'string') return CliWritable.fromPath(redirection)

    // pipe output to input; e.g. echo | cat
    if (typeof redirection === 'function') {
      const middle = new PassThrough()
      redirection({ stdin: middle })
      return middle
    }

    throw new TypeError(`Invalid output redirection: ${redirection}`)
  }

  #info
  #slots

  constructor(
    info = { },
    slots = [ STDIN_FD, STDOUT_FD, STDERR_FD ],
  ) {
    this.#info = info
    this.#slots = slots

    // each entry is { slot, name, isInput, isOutput }
    // and is double indexed by name and slot
    this.#info = Object.entries({ 
      ...CliShellStdio.DefaultStdioInfo, ...info
    }).reduce((acc, entry) => {
      const [ name, { slot, isInput, isOutput } ] = entry
      acc[slot] = acc[name] = { name, slot, isInput, isOutput }
      return acc
    }, { })
  }

  // redirect; e.g. cmd > output.txt 2> error.txt < input.txt
  // redirect; e.g. cmd <<< 'hello world'
  // redirect; e.g. cmd <<EOF 'hello world' EOF
  // redirect; e.g. cmd < <(echo 'hello world')
  redirect(redirections) {
    // here-string; e.g. echo <<< "hello world"
    if (typeof redirections === 'string' || Buffer.isBuffer(redirections)) 
      redirections = { stdin: CliReadable.from(redirections) }

    // here-doc; e.g. echo <<EOF "hello world" EOF
    else if (Array.isArray(redirections)) {
      redirections = redirections.flatMap(value => [value, '\n'])
      redirections = { stdin: CliReadable.from() }
    }

    // process substitution; e.g. echo <(echo "hello world")
    else if (redirections[Symbol.asyncIterator] || redirections[Symbol.iterator])
      redirections = { stdin: CliReadable.from(redirections) }

    // assume output redirection...; e.g. echo > /dev/null
    else if (redirections == null) 
      redirections = { stdout: DEV_NULL }
    
    // assume output redirection...; e.g. echo > file.txt
    else if (redirections instanceof Writable) 
      redirections = { stdout: redirections }

    // ...unless it is a readable stream, then input redirection; e.g. echo < file.txt
    else if (redirections instanceof Readable) 
      redirections = { stdin: redirections }

    const slots = this.#slots
  
    // activate and replace stdio streams
    const children = []
    for (const entry of Object.entries(redirections)) {
      const [name, redirection] = entry

      const { slot, isInput } = this.#info[name]
      if (slot == null) throw new Error(`Invalid redirection name: ${name}`)
      
      slots[slot] = 
        // if number, then fd substitution; e.g. echo 0<&3
        typeof value == 'number' ? slots[value] : 

        // input/output redirections
        isInput ? CliShellStdio.#activateInputRedirect(redirection) 
          : CliShellStdio.#activateOutputRedirect(redirection)

      // yield responsibility for subshells discovered during activation
      if (typeof redirection == 'function') children.push(redirection)
    }
    return children
  }

  copy() {
    return new CliShellStdio(this.#info, [ ...this.#slots ])
  }

  spawn(command, args = [], options = {}) {
    const slots = this.#slots

    const stdio = slots.map(entry => 
      entry instanceof Stream ? 'pipe' : entry ?? 'inherit'
    )
  
    const child = spawn(command, args, { ...options, stdio })
  
    slots.forEach((stream, i) => {
      if (stream instanceof Stream == false) return

      const pipe = child.stdio[i]
      const { isInput, isOutput } = this.#info[i]

      if (isInput) stream.pipe(pipe)
      else if (isOutput) pipe.pipe(stream)
      else if (stream instanceof Duplex) pipe.pipe(stream)
      else if (stream instanceof Readable) stream.pipe(pipe)  
      else if (stream instanceof Writable) pipe.pipe(stream)
    })
  
    return child
  }
}
