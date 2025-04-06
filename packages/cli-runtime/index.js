import { CliCommand } from '@kingjs/cli-command'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { IdentifierStyle } from '@kingjs/identifier-style'
import { AsyncEmitter } from '@kingjs/async-emitter'
import { CliService } from '@kingjs/cli-service'
import { CliConsoleMon } from '@kingjs/cli-console'
import { 
  CliRuntimeContainer, 
  CliRuntimeActivator 
} from '@kingjs/cli-runtime-container'

const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const EXIT_ERRORED = 2
const EXIT_ERRORED_UNCAUGHT = EXIT_ERRORED + 1
const EXIT_ERRORED_UNHANDLED = EXIT_ERRORED + 2
const EXIT_ABORT = 128
const EXIT_SIGINT = EXIT_ABORT + 2

export class CliRuntimeState extends CliService { 
  static services = {
    console: CliConsoleMon,
  }
  static { this.initialize(import.meta) }

  constructor(options) { 
    if (CliRuntimeState.initializing(new.target)) 
      return super()
    super(options)

    const { console } = this.getServices(CliRuntimeState, options)

    const { runtime } = this
    runtime.once('beforeAbort', async () => { await console.is('aborting') })
    runtime.once('beforeExit', async () => {
      await console.update('exiting', runtime.exitCode)
      await console.is(
        runtime.succeeded ? 'succeeded' :
        runtime.aborted ? 'aborted' :
        runtime.errored ? 'errored' :
        'failed'
      )
    })

    runtime.on('pulse', (...record) => { console.update('data', ...record) })
  }
}

export class CliRuntime extends AsyncEmitter {
  static async activate(classOrPojo, options = { }) {
    const { metadata } = options
    const isClass = typeof classOrPojo == 'function'
    const class$ = isClass ? classOrPojo : CliCommand.extend(classOrPojo)
    const cachedMetadata = CliClassMetadata.fromMetadataPojo(
      metadata ?? await (
        await CliClassMetadata.fromClass(class$)
      ).toPojo()
    )
    const info = CliCommandInfo.fromMetadata(cachedMetadata)
    return new CliRuntime(class$, info)
  }

  #class // CliCommand
  #info // CliCommandInfo
  #exitError
  #exitCode
  #abortController

  constructor(class$, info) {
    super()
    this.#class = class$
    this.#info = info
    this.#abortController = new AbortController()
  }
 
  #onError(code, error) {
    this.#exitCode = code
    this.#exitError = error
    console.error(error)
  }
  
  get class() { return this.#class }
  get info() { return this.#info }
  get exitError() { return this.#exitError }
  get exitCode() { return this.#exitCode }
  get signal() { return this.#abortController.signal }

  get running() { return process.exitCode === undefined }
  get succeeded() { return process.exitCode == EXIT_SUCCESS }
  get aborted() { return process.exitCode == EXIT_SIGINT }
  get failed() { return process.exitCode == EXIT_FAILURE }
  get errored() { 
    return process.exitCode == EXIT_ERRORED
      || process.exitCode == EXIT_ERRORED_UNHANDLED
      || process.exitCode == EXIT_ERRORED_UNCAUGHT
  }
  
  async getCommandInfo(path) {
    return await CliRuntimeCommandInfo.activate(this, path)
  }

  async execute(userPath, userArgs) {

    // unstructured => structured error handling
    try {
      
      // signaling => event oriented abortion
      // capture SIGINT once; a second break kills the runtime
      process.once('SIGINT', async () => { 
        this.#exitCode = EXIT_SIGINT
        await this.emitAsync('beforeAbort')
        this.#abortController.abort() 
      })

      // trap ungraceful shutdown
      process.once('uncaughtException', (error) => { 
        this.#onError(EXIT_ERRORED_UNCAUGHT, error) 
      })
      process.once('unhandledRejection', (reason) => {
        this.#onError(EXIT_ERRORED_UNHANDLED, reason) 
      })

      // procedural => declarative initialization
      const command = await this.getCommandInfo(userPath)

      // functional => object oriented execution
      const result = await command.execute(userArgs)

      if (this.aborted) return
      switch (result) {
        case undefined:
        case true: this.#exitCode = EXIT_SUCCESS; break
        case typeof result == 'number': this.#exitCode = result; break
        default: this.#exitCode = EXIT_FAILURE; break
      }

    } catch (error) { 
      this.#onError(EXIT_ERRORED, error) 

    } finally {
      // stop any CliThreads
      this.#abortController.abort() 

      // trap graceful shutdown; the goal is a graceful shutdown of node, not exit(0)
      process.once('beforeExit', async () => { 
        process.exitCode = this.#exitCode 
        await this.emitAsync('beforeExit')
      })
    }
  }

  toString() {
    if (this.succeeded) return 'Command succeeded'
    if (this.aborted) return `Command aborted`
    if (this.failed) return `Command failed`
    if (this.errored) return `Command exception: ${this.exitError}`
    assert(this.running)
    return 'Running...'
  }
}

export class CliPathStyle {
  static fromUser(path = []) {
    return this.fromRuntime(
      path.map(o => IdentifierStyle.fromKebab(o).toCamel())
    )
  }
  static fromRuntime(path = []) {
    return new CliPathStyle(path)
  }

  #names

  constructor(names) {
    this.#names = names
  }

  toUser() {
    return this.#names.map(o => IdentifierStyle.fromCamel(o).toKebab())
  }
  toRuntime() {
    return this.#names
  }

  toString() {
    return this.toUser().join(' ')
  }
}

export class CliRuntimeCommandInfo {
  static async activate(runtime, userPath) {
    const path = CliPathStyle.fromUser(userPath)
    const runtimePath = path.toRuntime()
    const class$ = await runtime.class.getCommand(...runtimePath)
    const info = runtime.info.getCommand(...runtimePath)
    const parameters = await Array.fromAsync(this.#runtimeParameters(info))
    return new this(runtime, path, class$, info, parameters)
  }

  static async *#runtimeParameters(info) {
    // walk command hierarchy yielding parameters; allow derived classes to 
    // override base class parameters; skip local inherited parameters
    const slots = new Map()
    for await (const parameter of info.parameters()) {
      yield parameter
      slots.set(parameter.name, parameter)
    }

    for (const current of info.parent?.hierarchy() ?? []) {
      for await (const parameter of current.parameters() ) {
        if (slots.has(parameter.name)) continue
        if (parameter.isLocal) continue
        yield parameter
        slots.set(parameter.name, parameter)
      }
    }
  }

  #runtime
  #path
  #class
  #info
  #parameters
  #container

  constructor(runtime, path, class$, info, parameters) {
    this.#runtime = runtime
    this.#path = path
    this.#class = class$
    this.#info = info
    this.#parameters = parameters.sort((a, b) => a.position - b.position)
    this.#container = new CliRuntimeContainer(runtime.signal)
  }

  get runtime() { return this.#runtime }

  get path() { return this.#path }
  get runtimePath() { return this.#path.toRuntime() }
  get userPath() { return this.#path.toUser() }

  get class() { return this.#class }
  get info() { return this.#info }
  get parameters() { return this.#parameters }

  #getArgs(userArgs) {
    // Assume argv is an object generated by a cli framework like yargs;
    // Assume argv names match the style entered on the command line;
    // Assume argv properties are in kabab case and positional args are named.

    // Return an array of positional arguments with an additional last element
    // which is an object containing the option arguments with names converted
    // to camel case.
    const options = { _info: this }
    const result = []
    
    // cli => javascript stack framing (mixed => [...positional, {...options}])
    for (const parameter of this.#parameters) {
      const { name, kababName, isPositional } = parameter
      const userName = kababName ?? name
      if (isPositional) {
        result.push(userArgs[userName])
      } else if (Object.hasOwn(userArgs, userName)) {
        options[name] = userArgs[userName]
      }
    }
    result.push(options)

    return result
  }

  getServices(class$, options = { }) {
    // instance => container activation (IoC)
    return this.#container.getServices(class$, options)
  }

  async execute(userArgs) {
    // cli => javascript casing (kabab => camel)
    const args = this.#getArgs(userArgs)
    const activator = new CliRuntimeActivator(this.class)
    const command = await activator.activate(...args)
    return await command.execute(this.runtime.signal)
  }
}
