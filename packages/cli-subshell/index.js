import { assert } from '@kingjs/assert'
import { AbortError } from '@kingjs/abort-error'
import { CliShellDraft } from '@kingjs/cli-shell-draft'
import { Lazy, LazyFn } from '@kingjs/lazy'
import { DraftorPromise } from '@kingjs/draft'
import { spawn } from 'child_process'
import { Writable, Readable, PassThrough } from 'stream'
import { 
  CliParentPipedReadableResource,
  CliParentPipedWritableResource,
  CliChildPipedReadableResource,
  CliChildPipedWritableResource,
  CliNullReadableResource,
} from '@kingjs/cli-resource'
async function __import() {
  const { cliSubshellToPojo } = await import('@kingjs/cli-subshell-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: cliSubshellToPojo, dumpPojo }
}

// Connecting subshells could be done by requiring subshells create their own
// pipes and then connecting them using PassThrough streams. While this is simple, 
// its hardly efficient. Here we make an effort to eliminate extra PassThroughs by
// allowing a subshell to ask adjacent subshells for their pipes. 
// 
// For example, a producer can ask a consumer for its stdin stream and then use it
// to pipe its output into the consumer thus avoiding the need for a PassThrough 
// stream. Alternatively, if the consumer does not create its own stdin pipe, then
// that same prodcuer could offer its own stdout stream to the consumer. If neither
// the producer or consumer create their own streams, then a PassThrough stream
// can be created and given to each subshell as a fallback. Or if both the consumer
// and producer create their own streams, then the consumer and pipe directly to the
// consumer.

// Ownership of streams is important when considering when to close streams. When
// piping to a stream, the runtime should close the consumer when the producer emits
// EOF only when the runtime owns the consumer. For example, if a subshell is piping to
// process.stdout, then the runtime should not close the stream when the producer emits
// EOF. If, however, the subshell is piping to a file created by the runtime in response
// to a redirect specified as a file path, then the runtime should close the consumer 
// when the producer emits EOF.

// The bash abstraction inspired our implementation. In bash, the activation of a
// subshell is a two step process. First, the command is specified and then the
// redirects are specified. In the abstract, activation of the subshell command must
// be delayed until the redirects are specified. That abstraction is implemented
// by DraftorPromise which is both a function and a promise. The function can be
// repatedly called to specify the redirects in a fluent manner. Once the redirects
// are specified, the promise is resolved and the subshell command is executed.

export class CliSubshell extends DraftorPromise {
  async __toPojo() {
    const { toPojo } = await __import()
    const pojo = await toPojo(this)
    return pojo
  }
  async __dump(options) {
    const { dumpPojo } = await __import()
    dumpPojo(await this.__toPojo(), options)
  }

  static fromArgs(parentShell, cmd, args) {
    return new CliProcessSubshell({ parentShell, cmd, args })
  }
  static fromFn(parentShell, fn, vars) {
    return new CliFunctionSubshell({ parentShell, fn, vars })
  }
  static fromBuiltin(parentShell, fn) {
    return new CliBuiltinSubshell({ parentShell, fn })
  }

  static #normalize(redirection) {
    // overload resolution; passing a subshell implies piping to stdout
    if (redirection instanceof CliSubshell)
      return { stdout: redirection }

    // here-string; e.g. echo <<< "hello world"
    if (Buffer.isBuffer(redirection)) 
      return { stdin: redirection }

    if (typeof redirection === 'string') 
      return { stdin: Buffer.from(redirection) }

    // here-doc; e.g. echo <<EOF "hello world" EOF
    if (Array.isArray(redirection))
      return { stdin: redirection }
    
    // assume output redirection...; e.g. echo > file.txt
    if (redirection instanceof Writable) 
      return { stdout: redirection }

    // ...unless it is a readable stream, then input redirection; e.g. echo < file.txt
    if (redirection instanceof Readable) 
      return { stdin: redirection }

    // process substitution; e.g. echo <(echo "hello world")
    if (redirection?.[Symbol.asyncIterator] || redirection?.[Symbol.iterator])
      return { stdin: redirection }

    return redirection
  }
  
  #shell
  #__parent
  #__children
  #__draftShell
  #__id

  constructor(parentShell, vars) {
    const { loader } = parentShell
    const children = []
    const supplantedRedirects = []
    const shellDraft = new CliShellDraft(parentShell, vars)
    const thenFns = []

    // There are two types of subshells: interprocess and intraprocess. 
    // 
    // Interprocess subshells (spawn) are created by the spawn() method and can 
    // create their own streams when 'pipe' is specified in the stdio array. 
    // 
    // Intraprocess subshells (func) are in-process subshells that invoke a 
    // javascript function. Intraprocess subshells do not create their own streams. 
    // 
    // Given Interprocess and Intraprocess subshells, there are three types of 
    // connections that can be made:
    //
    // 1. func <-> func: A passthrough is created and given to each subshell.
    // 2. spawn <-> spawn: The output is piped into the input.
    // 3. spawn <-> func: The func subshell uses the pipe from the spawn subshell.
    //
    // In all cases, the streams connecting the subshells do not have fds. This
    // fact is encpsulated by the CliPiped[Readable|Writable]Resource classes.
    // The ability to test for the existence of a fd without loading the 
    // underlying stream is needed by spawn() when constructing the stdio 
    // array since a piped stream is created *after* spawn() creates the process.
    function interSubshellRedirect(parent, { isInput, slot }, child) {
      // register child edges in subshell DAG 
      children.push(child)

      const isParentConsumer = isInput
      const isChildConsumer = !isParentConsumer

      const parentSlot = slot
      const childSlot = isChildConsumer ? 0 : 1

      const parentPipeFn = parent.getPipe$(parentSlot)
      const childPipeFn = child.getPipe$(childSlot)
      const passThrough = parentPipeFn || childPipeFn ? null : new PassThrough()
      const passThroughFn = () => passThrough

      const connect = LazyFn(function connect() {
        if (childPipeFn && parentPipeFn) {
          const consumerPipeFn = isParentConsumer ? parentPipeFn : childPipeFn
          const producerPipeFn = isParentConsumer ? childPipeFn : parentPipeFn
          producerPipeFn().pipe(consumerPipeFn())
        }
      })

      // activate parent resource
      const ParentCtor = isParentConsumer 
        ? CliParentPipedReadableResource 
        : CliParentPipedWritableResource
      const parentResource = new ParentCtor(() => {
        connect()
        return (parentPipeFn ?? childPipeFn ?? passThroughFn)()
      }, { [isParentConsumer ? '__from' : '__to']: child.__id })

      // activate child resource
      const ChildCtor = isChildConsumer 
        ? CliChildPipedReadableResource 
        : CliChildPipedWritableResource
      const childResource = new ChildCtor(() => {
        connect()
        return (childPipeFn ?? parentPipeFn ?? passThroughFn)()
      }, { [isChildConsumer ? '__from' : '__to']: parent.__id }) 

      // redirect parent/child resources
      parent({ [parentSlot]: parentResource })
      child({ [childSlot]: childResource })

      child.__setParent(parent)
    }

    function intraSubshellRedirect(info, redirection) {
      shellDraft.revise(info, redirection, {
        // gather supplanted redirects; e.g. : > a > b, a is supplanted by b
        // supplanting a slot still results in resource activation/disposal
        // e.g. : > a.txt > b.txt still results in a.txt being created/closed
        // We will await disposal of the supplanted redirects before we start the
        // pipeline.
        supplant(redirection) { supplantedRedirects.push(redirection) },
      })
    }

    super({
      revise(redirections = { }) {
        // overload resolution; javascript primitive -> { [slot]: redirection }
        redirections = CliSubshell.#normalize(redirections)

        // activate/replace resources
        for (const entry of Object.entries(redirections)) {
          const [name, redirection] = entry

          // add defferred promise transform
          if (name == 'then') {
            thenFns.push(redirection)
            continue
          }

          // load slot info
          const info = loader.getInfo(name)
          if (info == null) throw new TypeError(`Invalid redirect target: ${name}`)

          const isSubshell = redirection instanceof CliSubshell
          if (isSubshell) 
            return interSubshellRedirect(this, info, redirection)

          intraSubshellRedirect(info, redirection)
        }
      },
      publish() {
        const { shell } = this

        // connect pipes
        const { slots } = shell
        for (let i = 0; i < slots.length; i++) {
          const pipeFn = this.getPipe$(i)
          const pipe = pipeFn ? pipeFn() : null
          if (!pipe) continue

          const slot = slots[i]
          slot.connect(pipe)
        }

        const result = Promise.all(
          // close the fds of supplanted redirects 
          supplantedRedirects.map(o => o.dispose())
        ).then(() => Promise.all([
          // start parallel execution; wait for pipeline to finish
          this.run$(shell), 
          ...children
        ])).then(([result, childResults = []]) => [
          // flattent the results of the pipeline
          result, 
          ...childResults.flatMap(x => x)
          // project the results of the pipeline
        ]).then(results => this.then$(results))

        // apply defferred promise transforms; e.g. reverse pipline results, etc.
        return thenFns.reduce((result, thenFn) => {
          return result.then(thenFn)
        }, result)
      }
    })

    this.#shell = new Lazy(() => shellDraft.publish())
    this.#__children = children
    this.#__draftShell = shellDraft
    this.#__id = parentShell.__getSubshellId()
  }

  get shell() { return this.#shell.value }
  get isInProcess() { return false }
  get isUser() { return false }
  get isBuiltin() { return false }
  get __id() { return this.#__id }
  get __type() {
    // ctor name less 'Cli' prefix and 'Subshell' suffix
    const ctor = this.constructor.name
    const prefix = 'Cli'
    const suffix = 'Subshell'
    return ctor.substring(prefix.length, ctor.length - suffix.length)
  }
  get __children() { return this.#__children }
  get __slots() { return this.#__draftShell.__slots }

  __setParent(parent) { 
    assert(!this.#__parent, 'Parent already set')
    this.#__parent = parent 
  }
  
  then$(results) { return results }
  getPipe$(slot) { }
  run$() { }
}

export class CliInProcessSubshell extends CliSubshell {
  #fn

  constructor({ parentShell, vars, fn }) {
    super(parentShell, vars)

    this.#fn = fn
  }

  get isInProcess() { return true }
  get __name() { return this.#fn.name }

  async run$(shell) {
    try {
      return this.return$(await this.#fn(shell))
    } finally {
      await this.shell.dispose()
    }
  }
  async return$(result) { 
    return result
  }
}

export class CliFunctionSubshell extends CliInProcessSubshell {
  constructor({ parentShell, vars, fn }) {
    super({ parentShell, vars, fn })
  }

  get isUser() { return true }

  async return$(result) {
    const { shell } = this
    let exitCode = 0

    // process result
    if (result && typeof result[Symbol.asyncIterator] === 'function') {
      for await (const item of result) {
        if (Buffer.isBuffer(item)) {
          // streaming buffer
          shell.stdout.write(item.toString())
        } else {
          // streaming serialized records
          shell.stdout.write(item)
          shell.stdout.write('\n')
        }
      }
    } else if (typeof result === 'string') {
      shell.stdout.write(result)
    } else if (typeof result === 'number') {
      exitCode = result
    } 

    return exitCode
  }
}

export class CliBuiltinSubshell extends CliInProcessSubshell {
  constructor({ parentShell, fn }) {
    super({ parentShell, fn })
  }

  then$(results) {
    return results[0]
  }

  get isBuiltin() { return true }
}

export class CliProcessSubshell extends CliSubshell {
  #cmd
  #args
  #child
  #__stdio

  constructor({ parentShell, cmd, args }) {
    super(parentShell)
    this.#cmd = cmd
    this.#args = args
    this.#child = new Lazy(() => {
      const { shell } = this
      const { slots } = shell
      const stdio = this.#__stdio = slots.map(resource => {
        if (resource.hasFd) 
          return resource.fd
        if (resource instanceof CliNullReadableResource) 
          return 'ignore'
        return 'pipe'
      })

      // flatten the env object; this is a workaround for the fact that
      // the child_process.spawn() method does not flatten the env object.
      const env = { }
      for (const key in shell.env) 
        env[key] = shell.env[key]

      const { cmd, args } = this
      const { $: cwd } = shell.cwd()
      return spawn(cmd, args, { env, cwd, stdio })
    }, this)

    // ⚠ Design Limitation: Bash allows a spawned process to lazily inherit stdin.
    // In Bash, if the child process does *not* read from its inherited stdin,
    // the parent's stdin remains untouched — preserving the input stream.
    //
    // Node cannot fully replicate this behavior in all cases.
    //
    // In Node, a child can receive stdin in two main ways:
    // (1) If the parent stream has a file descriptor (fd), it can be passed
    //     directly via `stdio: [fd, ...]`, preserving Bash-like lazy semantics.
    // (2) If the parent stream lacks a real fd, Node sets up a pipe and exposes
    //     `child.stdin` — requiring the parent to explicitly `.pipe()` data in.
    //
    // In case (2), piping eagerly consumes the parent stream regardless of
    // whether the child ever reads from stdin. This breaks the abstraction that
    // "all pipes are equal" between subshells.
    //
    // To prevent premature consumption, the stdin must be nulled. This nulling
    // could be done explictly by the user, or implicitly by the runtime. The
    // latter is chosen because hanging the spawned process for lack of stdin
    // is a more explict failure than siliently fetching and discarding input.
    this({ stdin: null })
  }

  get cmd() { return this.#cmd }
  get args() { return this.#args }
  get child() { return this.#child.value }

  getPipe$(slot) { return () => this.child.stdio[slot] }

  async run$() {
    return new Promise((accept, reject) => {
      let result = { }
      const child = this.child
      child.on('error', reject)
      child.on('exit', (code, signal) => (result = { code, signal }))
      child.on('close', () => {
        const { signal, code } = result
        if (signal == 'SIGINT') 
          return reject(new AbortError('CliShell'))
        // TODO: failures should include a log dump; revisit once we have a logger
        if (signal) 
          return reject(new Error(`Child process killed by signal: ${signal}`))
        accept(code)
      })
    })
  }

  __cmd() { return this.#cmd == process.execPath ? 'node' : this.#cmd }
  __args() { return this.#args }
  toString() { return this.#cmd + ' ' + this.#args.join(' ') }
}
