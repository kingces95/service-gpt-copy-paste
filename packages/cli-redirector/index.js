import { Writable, Readable } from 'stream'
import { CliReadable, DEV_NULL } from '@kingjs/cli-readable'
import { CliWritable } from '@kingjs/cli-writable'
import { PassThrough } from 'stream'
import { CliSubshell } from '@kingjs/cli-subshell'

class CliPassThrough extends PassThrough { }

export class CliRedirector {
  
  static #activateInputRedirect(redirection) {
    // fd redirect; e.g. echo 0<&3
    if (redirection instanceof Readable) 
      return redirection

    // path redirect; e.g. echo < file.txt
    if (redirection == null) redirection = DEV_NULL
    if (typeof redirection === 'string') 
      return CliReadable.fromPath(redirection)

    // pipe input from output; e.g. echo <(echo 'hello world')
    if (redirection instanceof CliSubshell) {
      const middle = new CliPassThrough()
      redirection({ stdout: middle })
      return middle
    }
    
    throw new TypeError(`Invalid input redirection: ${redirection}`)
  }

  static #activateOutputRedirect(redirection) {
    // fd redirect; e.g. echo 1>&3
    if (redirection instanceof Writable) 
      return redirection
    
    // path redirect; e.g. echo > file.txt
    if (redirection == null) redirection = DEV_NULL
    if (typeof redirection === 'string') 
      return CliWritable.fromPath(redirection)

    // pipe output to input; e.g. echo | cat
    if (redirection instanceof CliSubshell) {
      const middle = new CliPassThrough()
      redirection({ stdin: middle })
      return middle
    }

    throw new TypeError(`Invalid output redirection: ${redirection}`)
  }

  #info
  #stdio

  constructor(info, stdio) {
    this.#info = info
    this.#stdio = stdio
  }

  get info() { return this.#info }
  get slots() { return this.#stdio }

  async open() {
    // settle any promises in the slots array; open redirection streams
    return await Promise.all(this.#stdio)
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
    else if (redirections?.[Symbol.asyncIterator] || redirections?.[Symbol.iterator])
      redirections = { stdin: CliReadable.from(redirections) }
    
    // assume output redirection...; e.g. echo > file.txt
    else if (redirections instanceof Writable) 
      redirections = { stdout: redirections }

    // ...unless it is a readable stream, then input redirection; e.g. echo < file.txt
    else if (redirections instanceof Readable) 
      redirections = { stdin: redirections }

    // Mutation! This class is unlike the rest of the library in that
    // it mutates its state outside fo the constructor.
    const slots = this.#stdio
  
    // activate and replace stdio streams
    const children = []
    for (const entry of Object.entries(redirections)) {
      const [name, redirection] = entry
      if (!redirection) continue

      const { slot, isInput } = this.#info.getInfo(name) ?? { }
      if (slot == null) continue
      
      slots[slot] = 
        // if number, then fd substitution; e.g. echo 0<&3
        typeof value == 'number' ? slots[value] : 

        // input/output redirections
        isInput ? CliRedirector.#activateInputRedirect(redirection) 
          : CliRedirector.#activateOutputRedirect(redirection)

      // yield responsibility for subshells discovered during activation
      if (redirection instanceof CliSubshell) children.push(redirection)
    }
    return children
  }
}
