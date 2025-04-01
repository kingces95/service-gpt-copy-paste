import { CliServiceProvider } from '@kingjs/cli'
import { CliCommand } from '@kingjs/cli-command'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { IdentifierStyle } from '@kingjs/identifier-style'
import { getOwn } from '@kingjs/get-own'

export class CliRuntime {
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

  constructor(class$, info) {
    this.#class = class$
    this.#info = info
  }
  
  get class() { return this.#class }
  get info() { return this.#info }

  async getCommand(path) {
    return await CliRuntimeCommand.activate(this, path)
  }

  async execute(userPath, userArgs) {
    const command = await this.getCommand(userPath)
    return command.execute(userArgs)
  }
}

export class CliRuntimeContainer {
  #options
  #services

  constructor(options) {
    this.#options = options
    this.#services = new Map()
  }

  async getService(providerClass) {
    const services = this.#services

    if (!services.has(providerClass)) {
      if (!(providerClass.prototype instanceof CliServiceProvider))
        throw new Error(`Class ${providerClass.name} is not a service provider.`)
  
      const activator = new CliRuntimeActivator(providerClass)
      const serviceProvider = await activator.activate(this.#options)
      const service = await serviceProvider.activate()
      if (!service)
        throw new Exception(`Service provider ${providerClass.name} failed to provide a service.`)
      
      services.set(providerClass, service)
    }
    return services.get(providerClass)
  }
}

export class CliRuntimeActivator {
  #class
  #name
  #discriminations

  constructor(class$) {
    this.#class = class$
    // If class$ command has an option with a choice constraint, then that option can
    // be used as a discriminator to select an alternative command to activate.

    // The single choice which is an object instead of an array is a discriminator. 
    const choices = getOwn(class$, 'choices') ?? { 
      // myOption: [ 'left', 'right' ],
      // myDiscriminator: { foo: @kingjs/mycmd/foo, bar: @kingjs/mycmd/bar }
    }

    const ownDiscriminatingOption =  
      Object.entries(choices).find(([_, value]) => typeof value == 'object') ?? []

    const [name, discriminations] = ownDiscriminatingOption
    this.#name = name
    this.#discriminations = discriminations
  }

  get name() { return this.#name }
  get class() { return this.#class }
  get discriminations() { return this.#discriminations }

  async #getClass(options) {
    const { name, discriminations, class: class$ } = this
    if (!name) return class$

    const discriminator = options[name]
    const importOrObject = discriminations[discriminator]
    if (!importOrObject) return class$

    // runtime class must be a derivation enclosing class
    const runtimeClass = await class$.loadOrDeclareClass([name, importOrObject])
    if (runtimeClass != class$ && !(runtimeClass.prototype instanceof class$))
      throw new Error(`Class ${runtimeClass.name} must extend ${class$.name}`)
    
    return runtimeClass
  }

  async activate(...args) {
    const options = args.at(-1)
    const class$ = await this.#getClass(options)
    return new class$(...args)
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

export class CliRuntimeCommand {
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
    this.#parameters = parameters
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
    const result = []
    const options = { _info: this }

    const container = new CliRuntimeContainer(options)
    options._container = container

    const parameters = this.#parameters
    for (const parameter of [...parameters].sort((a, b) => a.position - b.position)) {
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

  async execute(userArgs) {
    const command = this.class
    const args = this.#getArgs(userArgs)
    const positionals = args.slice(0, -1)
    const options = args.at(-1)

    const { _container } = options
    const services = options._services = new Map()
    for (const [_, providerClass] of 
      command.getServiceProviderClasses({ recurse: true })) {  
      const service = await _container.getService(providerClass)
      services.set(providerClass, service)
    }
    
    const activator = new CliRuntimeActivator(command)
    return await activator.activate(...positionals, options)
  }
}