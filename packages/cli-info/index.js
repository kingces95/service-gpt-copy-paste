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

export class CliInfo {
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

export class CliParameterInfo extends CliInfo {
  static create(command, name, parameterMd) {
    return parameterMd.position !== undefined
      ? new CliPositionalInfo(command, name, parameterMd)
      : new CliOptionInfo(command, name, parameterMd)
  }

  #command
  #parameterMd
  #default

  constructor(command, name, parameterMd) {
    super(name)
    this.#command = command
    this.#parameterMd = parameterMd

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
    this.#default = this.#parameterMd.default ?? DEFAULT_DEFAULTS[this.type]
  }

  get isParameter() { return true }
  get isOption () { return this.#parameterMd.isOption }
  get isPositional() { return this.#parameterMd.isPositional }

  get type() { return this.#parameterMd.type }
  get isString() { return this.#parameterMd.isString }
  get isBoolean() { return this.#parameterMd.isBoolean }
  get isNumber() { return this.#parameterMd.isNumber }
  get isCount() { return this.#parameterMd.isCount }
  get isArray() { return this.#parameterMd.isArray }

  get default() { return this.#default }

  get defaultDescription() { return this.#parameterMd.defaultDescription }
  get description() { return this.#parameterMd.description }
  get position() { return this.#parameterMd.position }
  get normalize() { return this.#parameterMd.normalize }
  get isRequired() { return this.#parameterMd.required }
  get isOptional() { return this.#parameterMd.optional }
  get isLocal() { return this.#parameterMd.local }
  get isHidden() { return this.#parameterMd.hidden }
  get isVariadic() { return this.#parameterMd.variadic }

  *aliases() { yield* this.#parameterMd.aliases() }
  *choices() { yield* this.#parameterMd.choices() }
  *conflicts() { yield* this.#parameterMd.conflicts() }
  *implications() { yield* this.#parameterMd.implications() }

  get command() { return this.#command }
}

export class CliCommandInfo extends CliInfo {
  static from(metadata) {
    return new CliCommandInfo(null, null, metadata)
  }

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
    classMdStart, 
    classMdEndExclusive) {

    if (!classMdStart) return
    for (const current of classMdStart.hierarchy()) {
      if (current == classMdEndExclusive) return
      yield current
    }

    if (!classMdEndExclusive) return
    throw new Error([
      `Class ${classMdEndExclusive.name} not found`,
      `as base class of ${originalClassInfo.name}.`
    ].join(' '))
  }

  #parent
  #classMd
  #commands
  #parameters

  constructor(parent, name, classMd) {
    super(name)

    this.#parent = parent
    this.#classMd = classMd

    // Load nested commands
    this.#commands = new LoadAsync(async () => {
      const result = new Map()
      for await (const [name, commandMd] of this.#classMd.commands()) {
        const scope = new CliCommandInfo(this, name, commandMd)
        result.set(name, scope)
      }
      return result
    })

    // Load parameters; walk class hierarchy ending with parent's class (exclusive)
    // Allow more derived classes to override parameters of base classes.
    this.#parameters = new Lazy(() => {
      const result = new Map()
      for (const parameter of this.#classMd.parameters()) {
        const name = parameter.name
        result.set(name, new CliParameterInfo(this, name, parameter))
      }
      
      for (const classInfo of CliCommandInfo.#getClassHierarchy(
        this.#classMd.baseClass, 
        this.parent?.classMd$)) {

        for (const parameter of classInfo.parameters()) {
          const name = parameter.name
          if (result.has(name)) continue
          if (parameter.local) continue
          result.set(name, new CliParameterInfo(this, name, parameter))
        }
      }
      return result
    })
  }

  get isCommand() { return true }

  get parent() { return this.#parent }
  get classMd$() { return this.#classMd }

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
  async getCommand(nameOrNames = [], recursing$) {
    const names = Array.isArray(nameOrNames) 
      ? [...nameOrNames] : [nameOrNames]
      
    if (names.length == 0)
      return this

    const name = names.shift()
    const map = await this.#commands.load()
    const command = map.get(name)?.getCommand(names, recursing$ ?? true)
    if (recursing$) return command
    if (!command) throw new Error(`Command not found: ${names.join(' ')}`)
    return command
  }

  get description() { return this.#classMd.description }
  *parameters() { yield* this.#parameters.value.values() }
  getParameter(name) { return this.#parameters.value.get(name) }
  *positionals() { yield* this.parameters().filter(o => o.isPositional) }
  *options() { yield* this.parameters().filter(o => o.isOption) }

  toString() { return `${this.name}, path=${this.path}, type=command` } 

  async toPojo() {
    const { toPojo } = await __import()
    return await toPojo(await this)
  }
  
  async __dump() {
    const { dumpPojo } = await __import()
    await dumpPojo(await this.toPojo())
  }
}
