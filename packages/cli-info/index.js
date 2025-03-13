import { Lazy } from '@kingjs/lazy'
import { LoadAsync } from '@kingjs/load'
async function __import() {
  const { cliInfoToPojo } = await import('@kingjs/cli-info-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: cliInfoToPojo, dumpPojo }
}

const DEFAULT_DEFAULTS = {
  string: null,
  array: null,
  count: null,
  boolean: false,
  number: 0,
}

export class CliInfoId {
  #name

  constructor(name) {
    this.#name = name ?? null
  }

  get isParameter() { return false }
  get isPositional() { return false }
  get isOption() { return false }
  get isCommand() { return false }
  get infoType() {
    if (this.isParameter) return 'parameter'
    if (this.isPositional) return 'positional'
    if (this.isOption) return 'option'
    if (this.isCommand) return 'command'
    return 'info'
  }

  get name() { return this.#name }

  toString() { 
    return `${this.name}, type=${this.infoType}` 
  }
}

export class CliParameterInfo extends CliInfoId {
  static create(command, name, mdParameter) {
    return mdParameter.position !== undefined
      ? new CliPositionalInfo(command, name, mdParameter)
      : new CliOptionInfo(command, name, mdParameter)
  }

  #command
  #classParameter
  #default

  constructor(command, name, classParameter) {
    super(name)
    this.#command = command
    this.#classParameter = classParameter

    // A note on type, default, isRequired, and isOptional:
    //
    // A first implementation tested if default was not undefined to determine if
    // the parameter was optional. This caused problems since pojo pruning would
    // strip null and false values which are valid defaults.
    // 
    // The current implementation tests isOptional for positionals and not isRequired
    // for options to determine if the parameter is optional. If the parameter is
    // optional and default is undefined, then a "default default" is selected based on 
    // the type: null for strings/arrays/counts, false for booleans, 0 for numbers.
    this.#default = this.#classParameter.default ?? DEFAULT_DEFAULTS[this.type]
  }

  get isParameter() { return true }
  get isOption () { return this.#classParameter.isOption }
  get isPositional() { return this.#classParameter.isPositional }

  get type() { return this.#classParameter.type }
  get isString() { return this.#classParameter.isString }
  get isBoolean() { return this.#classParameter.isBoolean }
  get isNumber() { return this.#classParameter.isNumber }
  get isCount() { return this.#classParameter.isCount }
  get isArray() { return this.#classParameter.isArray }

  get default() { return this.#default }

  get defaultDescription() { return this.#classParameter.defaultDescription }
  get description() { return this.#classParameter.description }
  get position() { return this.#classParameter.position }
  get normalize() { return this.#classParameter.normalize }
  get isRequired() { return this.#classParameter.required }
  get isOptional() { return this.#classParameter.optional }
  get isLocal() { return this.#classParameter.local }
  get isHidden() { return this.#classParameter.hidden }
  get isVariadic() { return this.#classParameter.variadic }

  *aliases() { yield* this.#classParameter.aliases() }
  *choices() { yield* this.#classParameter.choices() }
  *conflicts() { yield* this.#classParameter.conflicts() }
  *implications() { yield* this.#classParameter.implications() }

  get command() { return this.#command }
}

export class CliCommandInfo extends CliInfoId {
  static *runtimeParameters(command) {
    // walk command hierarchy yielding parameters; allow derived classes to 
    // override base class parameters; skip local inherited parameters
    const result = new Map()
    for (const parameter of command.parameters()) {
      yield parameter
      result.set(parameter.name, parameter)
    }

    for (const current of command.parent?.hierarchy() ?? []) {
      for (const parameter of current.parameters() ) {
        if (result.has(parameter.name)) continue
        if (parameter.isLocal) continue
        yield parameter
        result.set(parameter.name, parameter)
      }
    }
  }

  static *#getClassHierarchy(
    classInfoStart, 
    classInfoEndExclusive) {

    // do no recursive starting at start and ending at end
    for (const current of classInfoStart.hierarchy()) {
      if (current == classInfoEndExclusive)
        break

      if (!current) {
        if (classInfoEndExclusive) throw new Error([
          `Class ${classInfoEndExclusive.name} not found`,
          `as base class of ${originalClassInfo.name}.`].join(' '))
        break
      }

      yield current
    }
  }

  #parent
  #loader
  #metadata
  #commands
  #parameters

  constructor(loaderOrParent, metadata, name) {
    super(name)

    const isRoot = loaderOrParent instanceof CliInfoLoader
    this.#loader = isRoot ? loaderOrParent : loaderOrParent.loader
    this.#parent = isRoot ? null : loaderOrParent
    this.#metadata = metadata

    // Load nested commands
    this.#commands = new LoadAsync(async () => {
      const result = new Map()
      for await (const [name, commandMd] of this.#metadata.commands()) {
        const scope = new CliCommandInfo(this, commandMd, name)
        result.set(name, scope)
      }
      return result
    })

    // Load parameters; walk class hierarchy ending with parent's class (exclusive)
    // Allow more derived classes to override parameters of base classes.
    this.#parameters = new Lazy(() => {
      const result = new Map()
      for (const classInfo of CliCommandInfo.#getClassHierarchy(
        this.#metadata, 
        this.parent?.metadata$)) {

        for (const parameter of classInfo.parameters()) {
          const name = parameter.name
          if (result.has(name))
            continue
          result.set(name, new CliParameterInfo(this, name, parameter))
        }
      }
      return result
    })
  }

  get isCommand() { return true }

  get loader() { return this.#loader }
  get parent() { return this.#parent }
  get metadata$() { return this.#metadata }

  *hierarchy() {
    yield this
    if (this.parent)
      yield* this.parent.hierarchy()
  }

  get path() { 
    return [...this.hierarchy()]
      .reverse()
      .map(o => o.name)
      .filter(Boolean)
      .join(' ') 
  }

  async *commands() { 
    const map = await this.#commands.load()
    yield* map.values()
  }
  async getCommand(name) { 
    const map = await this.#commands.load()
    return map.get(name) 
  }

  get description() { return this.#metadata.description }
  *parameters() { yield* this.#parameters.value.values() }
  getParameter(name) { return this.#parameters.value.get(name) }
  *positionals() { yield* this.parameters().filter(o => o.isPositional) }
  *options() { yield* this.parameters().filter(o => o.isOption) }

  toString() { return `${this.name}, path=${this.path}, type=command` } 
}

export class CliInfoLoader {
  #root

  constructor(metadataLoader) {
    this.#root = new Lazy(() => {
      const classInfo = metadataLoader.getClass()
      return new CliCommandInfo(this, classInfo)
    })  
  }

  async getCommand(nameOrNames = []) {
    const names = Array.isArray(nameOrNames) 
      ? nameOrNames : [nameOrNames]
    
    let command = this.#root.value
    for (const name of names) {
      command = await command.getCommand(name)
      if (!command)
        throw new Error(`Command not found: ${names.join(' ')}`)
    }

    return command
  }

  async toPojo() {
    const { toPojo } = await __import()
    return await toPojo(await this.getCommand())
  }
  
  async __dump() {
    const { dumpPojo } = await __import()
    await dumpPojo(await this.toPojo())
  }
}
