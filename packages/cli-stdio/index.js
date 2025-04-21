import { spawn } from 'child_process'
import { STDOUT_FD, STDERR_FD } from '@kingjs/cli-writable'
import { STDIN_FD } from '@kingjs/cli-readable'
import { Writable, Readable, Duplex, Stream } from 'stream'
import { CliReadable, DEV_NULL } from '@kingjs/cli-readable'
import { CliWritable } from '@kingjs/cli-writable'
import { PassThrough } from 'stream'
import { CliSubshell } from '@kingjs/cli-subshell'
import { Cli } from '@kingjs/cli'

class CliPassThrough extends PassThrough { }

export class CliStdioInfo {
  #byName
  #bySlot
  #byStream

  constructor(metadata = {
    stdin: { slot: 0, isInput: true, stream: process.stdin },
    stdout: { slot: 1, isOutput: true, stream: process.stdout },
    stderr: { slot: 2, isOutput: true, stream: process.stderr },
  }) {
    this.#byName = new Map()
    this.#bySlot = new Map()
    this.#byStream = new Map()

    // load metadata
    for (const entry of Object.entries(metadata)) {
      const [ name, { slot, isInput, isOutput, stream } ] = entry
      const metadatum = { slot, name, isInput, isOutput, stream }
      this.#byName.set(name, metadatum)
      this.#bySlot.set(slot, metadatum)
      this.#byStream.set(stream, metadatum)
    }
  }

  get byName() { return this.#byName }
  get bySlot() { return this.#bySlot }
  get byStream() { return this.#byStream }
  
  getInfo(streamOrIdOrName) {
    switch (typeof streamOrIdOrName) {
      case 'number': return this.#bySlot.get(streamOrIdOrName) ?? null
      case 'string': return this.#byName.get(streamOrIdOrName) ?? null
      case 'object': return this.#byStream.get(streamOrIdOrName) ?? null
      default: return null
    }
  }
  getFd(streamOrName) { return this.getInfo(streamOrName)?.slot ?? null }
  getStream(fdOrName) { return this.getInfo(fdOrName)?.stream ?? null }
  getName(fdOrStream) { return this.getInfo(fdOrStream)?.name ?? null }
  isKnown(streamOrIdOrName) { return this.getInfo(streamOrIdOrName) != null }
}

export class CliStdio {
  
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

  #defaults
  #slots

  constructor({
    defaults = new CliStdioInfo(),
    slots = [ STDIN_FD, STDOUT_FD, STDERR_FD ],
  } = { }) {
    this.#defaults = defaults
    this.#slots = slots
  }

  get defaults() { return this.#defaults }
  get slots() { return this.#slots }

  getStream(slotOrName) {
    const { slots, defaults } = this
    const fd = defaults.getFd(slotOrName)
    if (fd == null) throw new Error(`Invalid stream: ${slotOrName}`)
    const slot = slots[fd]
    if (slot instanceof Stream) return slot
    return defaults.getStream(fd) ?? null
  }
  get stdin() { return this.getStream(STDIN_FD) }
  get stdout() { return this.getStream(STDOUT_FD) }
  get stderr() { return this.getStream(STDERR_FD) }

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

    // Mutation! This class is unlike the rest of the library in that
    // it mutates its state outside fo the constructor.
    const slots = this.#slots
  
    // activate and replace stdio streams
    const children = []
    for (const entry of Object.entries(redirections)) {
      const [name, redirection] = entry

      const { slot, isInput } = this.#defaults.getInfo(name)
      if (slot == null) throw new Error(`Invalid redirection name: ${name}`)
      
      slots[slot] = 
        // if number, then fd substitution; e.g. echo 0<&3
        typeof value == 'number' ? slots[value] : 

        // input/output redirections
        isInput ? CliStdio.#activateInputRedirect(redirection) 
          : CliStdio.#activateOutputRedirect(redirection)

      // yield responsibility for subshells discovered during activation
      if (redirection instanceof CliSubshell) children.push(redirection)
    }
    return children
  }

  copy() {
    const { defaults, slots } = this
    return new CliStdio({ defaults, slots: [...slots] })
  }

  spawn(command, args = [], options = {}) {
    const { slots, defaults } = this

    const stdio = slots.map(entry => {
      if (!entry) return 'inherit'

      const fd = defaults.getFd(entry)
      if (fd != null) return fd
      
      if (entry instanceof Stream) return 'pipe'
      throw new TypeError(`Invalid stream: ${entry}`)
    })
  
    const child = spawn(command, args, { ...options, stdio })
  
    slots.forEach((stream, i) => {
      if (!(stream instanceof Stream) || defaults.isKnown(stream)) return

      const pipe = child.stdio[i]
      const { isInput, isOutput } = defaults.getInfo(i)

      // the parent process owns the child process's stdin regardless of who owns
      // the stream being piped to it so close the pipe when the upstream closes.
      const inOptions = { end: true }

      // close the stdout pipe if this child process owns the pipe. This is the 
      // case in a pipeline when a CliPassThrough is used to connect this child
      // to the down stream child but is not the case when the parent process 
      // passes its own stdout to the child process. 
      const outOptions = { end: stream instanceof CliPassThrough }

      if (isInput) stream.pipe(pipe, inOptions)
      else if (isOutput) pipe.pipe(stream, outOptions)
      else if (stream instanceof Duplex) pipe.pipe(stream, outOptions)
      else if (stream instanceof Readable) stream.pipe(pipe, inOptions)  
      else if (stream instanceof Writable) pipe.pipe(stream, outOptions)
    })
  
    return child
  }
}
