import { CliCommand } from '@kingjs/cli-command'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { IdentifierStyle } from '@kingjs/identifier-style'
import { CliService } from '@kingjs/cli-service'
import { CliConsoleMon } from '@kingjs/cli-console'
import { 
  CliRuntimeContainer, 
  CliRuntimeActivator 
} from '@kingjs/cli-runtime-container'
import { EventEmitter } from 'events'

const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const EXIT_ERRORED = 2
const EXIT_ABORT = 128
const EXIT_SIGINT = EXIT_ABORT + 2

export class CliRuntimeState extends CliService { 
  static services = {
    consoleMon: CliConsoleMon,
  }
  static { this.initialize(import.meta) }

  constructor(options) { 
    if (CliRuntimeState.initializing(new.target)) 
      return super()
    super(options)

    const { consoleMon } = this.getServices(CliRuntimeState, options)

    const { runtime } = this
    runtime.once('beforeAbort', () => consoleMon.is('aborting'))
    runtime.once('beforeExit', (exitCode, message) => {
      consoleMon.update('exiting', exitCode)
      consoleMon.is(
        runtime.succeeded ? 'succeeded' :
        runtime.aborted ? 'aborted' :
        runtime.errored ? 'errored' :
        'failed', message
      )
    })

    runtime.on('pulse', (...record) => { consoleMon.update('data', ...record) })
  }
}

export class CliRuntime extends EventEmitter {
  static runtimeServices = [ CliConsoleMon ]
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
  #threadPool
  #container

  constructor(class$, info) {
    super()
    this.#class = class$
    this.#info = info
    this.#container = new CliRuntimeContainer()
  }
 
  #onError(error) {
    this.#exitCode = EXIT_ERRORED
    this.#exitError = error
    console.error(error)
  }

  async #execute(userPath, userArgs) {

    // unstructured => structured error handling
    return new Promise(async (resolve) => {
      const controller = new AbortController()

      // procedural => declarative initialization
      const commandInfo = await this.getCommandInfo(userPath)

      let sigint = undefined
      const result = await Promise.race([ 
        // functional => object oriented execution
        commandInfo.activate(userArgs)
          .then(command => command.execute(controller.signal)), 

        // signaling => event oriented abortion
        new Promise((resolve) => process.on('SIGINT', 
          sigint = async () => {
            this.emit('beforeAbort')
            controller.abort()
            resolve(EXIT_SIGINT)
          })
        )
      ]).finally(() => process.off('SIGINT', sigint))

      resolve(result === undefined ? EXIT_SUCCESS
        : result === true ? EXIT_SUCCESS
        : result === false ? EXIT_FAILURE
        : typeof result == 'number' ? result
        : EXIT_FAILURE)
    })
  }

  get class() { return this.#class }
  get info() { return this.#info }
  get exitError() { return this.#exitError }
  get exitErrorMessage() { return !this.exitError ? null :
    this.#exitError?.message ?? 'Unknown error' 
  }
  get exitCode() { return this.#exitCode }

  get running() { return this.exitCode === undefined }
  get succeeded() { return this.exitCode == EXIT_SUCCESS }
  get aborted() { return this.exitCode == EXIT_SIGINT }
  get failed() { return this.exitCode == EXIT_FAILURE }
  get errored() { 
    return process.exitCode == EXIT_ERRORED
      || process.exitCode == EXIT_ERRORED
      || process.exitCode == EXIT_ERRORED
  }
  
  getServices(class$, options = { }) {
    return this.#container.getServices(class$, options)
  }

  async getCommandInfo(path) {
    return await CliRuntimeCommandInfo.activate(this, path)
  }

  async execute(userPath, userArgs) {

    // trap ungraceful shutdown
    const onError = this.#onError.bind(this)
    process.on('uncaughtException', onError)
    process.on('unhandledRejection', onError)

    this.#exitCode = await this.#execute(userPath, userArgs)
    this.emit('beforeExit', this.#exitCode, this.toString())
    await this.#container.dispose()

    // stop node runtime
    process.once('beforeExit', async () => { 
      process.off('uncaughtException', onError)
      process.off('unhandledRejection', onError)
      process.exitCode = this.#exitCode 
    })
  }

  toString() {
    if (this.succeeded) return 'Command succeeded'
    if (this.aborted) return `Command aborted`
    if (this.failed) return `Command failed`
    if (this.errored) return `Command exception: (${this.exitErrorMessage})`
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

  constructor(runtime, path, class$, info, parameters) {
    this.#runtime = runtime
    this.#path = path
    this.#class = class$
    this.#info = info
    this.#parameters = parameters.sort((a, b) => a.position - b.position)
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

  async activate(userArgs) {
    // cli => javascript casing (kabab => camel)
    const args = this.#getArgs(userArgs)
    const activator = new CliRuntimeActivator(this.class)
    return await activator.activate(...args)
  }
}
