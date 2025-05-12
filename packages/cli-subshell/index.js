import assert from 'assert'
import { AbortError } from '@kingjs/abort-error'
import { CliShellDraft } from '@kingjs/cli-shell-draft'
import { Lazy, LazyFn } from '@kingjs/lazy'
import { DraftorPromise } from '@kingjs/draft'
import { spawn } from 'child_process'
import { PassThrough } from 'stream'
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
// can be created and given to each subshell as a fallback. 

// Ownership of streams is important when considering when to close streams. When
// piping to a stream, the runtime should close the consumer when the producer emits
// EOF only when the runtime owns the consumer. For example, if a subshell is piping to
// process.stdout, then the runtime should not close the stream when the producer emits
// EOF. If, however, the subshell is piping to a file created by the runtime in response
// to a redirect specified as a file path, then the runtime should close the consumer 
// when the producer emits EOF. 

// Subshells are implemented as a class hierarchy. The base class calls members of the
// extneded classes. The base classes and their invocation methods are as follows:
//
// CliFunctor
//     calls update$() repeatedly then activate$()
// CliSubshell extends CliFunctor
//    activate$() calls run$()
//    takePipe$() calls getPipe$()
// CliFunctionSubshell extends CliSubshell
//    run$() calls return$()
// CliFunctionSubshell extends CliFunctionSubshell
//    implements return$()
// CliBuiltinSubshell extends CliFunctionSubshell
// CliCommandSubshell extends CliSubshell
//    implements getPipe$ and run$()

export class CliSubshell extends DraftorPromise {
  async __dump() {
    const { toPojo, dumpPojo } = await __import()
    dumpPojo(await toPojo(this))
  }

  static fromArgs(parentShell, cmd, args) {
    return new CliProcessSubshell({ parentShell, cmd, args })
  }
  static fromFn(parentShell, fn) {
    return new CliFunctionSubshell({ parentShell, fn })
  }
  static fromBuiltin(parentShell, fn) {
    return new CliBuiltinSubshell({ parentShell, fn })
  }

  #shell
  #__parent
  #__children
  #__draftShell
  #__id

  constructor(parentShell) {
    const children = []
    const supplantedRedirects = []
    const shellDraft = new CliShellDraft(parentShell)

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
    function redirectSubshell(parent, { isInput, slot }, child) {
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
      child.__setParent(parent)
      child({ [childSlot]: childResource })
      return parentResource
    }

    super({
      revise(redirections) {
        // overload resolution; passing a subshell implies piping to stdout
        if (redirections instanceof CliSubshell)
          redirections = { stdout: redirections }

        const self = this
        shellDraft.revise(redirections, {

          redirect(info, redirection) {
            const isSubshell = redirection instanceof CliSubshell
            if (isSubshell) return redirectSubshell(self, info, redirection)
          },

          // gather supplanted redirects; e.g. : > a > b, a is supplanted by b
          // supplanting a slot still results in resource activation/disposal
          // e.g. : > a.txt > b.txt still results in a.txt being created/closed
          // We will await disposal of the supplanted redirects before we start the
          // pipeline.
          supplant(redirection) { supplantedRedirects.push(redirection) },
        })
      },
      publish() {
        // connect to parent streams and trigger connection to siblings
        const { slots } = this.shell
        for (let i = 0; i < slots.length; i++) {
          const pipeFn = this.getPipe$(i)
          const pipe = pipeFn ? pipeFn() : null
          if (!pipe) continue

          const slot = slots[i]
          slot.connect(pipe)
        }
    
        return Promise.all(
          // close the fds of supplanted redirects 
          supplantedRedirects.map(o => o.dispose())
        ).then(() => Promise.all([
          // start parallel execution; wait for pipeline to finish
          this.run$(this.shell), 
          ...children
        ])).then(([result, childResults = []]) => [
          // flattent the results of the pipeline
          result, 
          ...childResults.flatMap(x => x)
          // project the results of the pipeline
        ]).then(results => this.then$(results))
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

  constructor({ parentShell, fn }) {
    super(parentShell)

    this.#fn = fn
  }

  get isInProcess() { return true }
  get name() { return this.#fn.name }

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
  constructor({ parentShell, fn }) {
    super({ parentShell, fn })
  }

  get isUser() { return true }

  async return$(result) {
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
      const { cmd, args } = this
      const { cwd, slots } = shell
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

      return spawn(cmd, args, { env, cwd, stdio })
    }, this)
  }

  get cmd() { return this.#cmd }
  get args() { return this.#args }
  get child() { return this.#child.value }

  getPipe$(slot) { return () => this.child.stdio[slot] }

  run$() {
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

  toString() { return this.#cmd + ' ' + this.#args.join(' ') }
}
