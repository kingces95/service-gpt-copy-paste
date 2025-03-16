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
  static fromMetadata(metadata) {
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
      `Class "${classMdEndExclusive.name}" not found`,
      `as base class of "${classMdStart.name}".`
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

    // Load parameters; The parameter set gathered by walking the class hierarchy
    // should match the parameter set gathered by walking the command scope hierarchy.
    // The sets match because by construction the class hierarchy is partitioned by 
    // the scope hierarchy and each command in the scope hierarchy contains the 
    // parameters of the classes in its partition.

    // For example, take the command 'mytool post'. Assume 'mytool' has no parameters
    // while 'post' has parameters necessary to perform a POST request. Assume a class
    // hierarchy like this:
    //    mytool: Cli -> MyTool
    //    post: Cli -> Web -> Http -> HttpPost
    // Filtering out those classes without parameters (assume MyTool and Web have none) 
    // and then partitioning by scope yields two sets, one for each scope:
    //    mytool: { Cli }
    //    post: { Http, HttpPost }
    // Hence the 'mytool' command would own all parameters on Cli (help, version, etc),
    // while the 'post' command would own all parameters on CliHttp (url, headers, etc)
    // and on Http (body, etc). Note that if we order the classes in the scope partitions
    // in the obvious way, then we get a set of classes: 
    //    Cli -> CliHttp -> HttpPost
    // which is a subset of target command's class hierarchy:
    //    Cli -> Web -> Http -> HttpPost
    // In this way the scope hierarchy is a partition of the subset of the class hierarchy
    // which have parameters. Hence, both hierarchies share the same parameter set.
    this.#parameters = new Lazy(() => {
      const result = new Map()
      for (const parameter of this.#classMd.parameters()) {
        const name = parameter.name
        result.set(name, new CliParameterInfo(this, name, parameter))
      }

      const baseClassMd = this.#classMd.baseClass
      const firstParentClassMdWithParameters = [
        ...this.parent?.classMd$.hierarchy() ?? [],
      ].find(o => [...o.parameters()].length > 0)
        
      for (const classInfo of CliCommandInfo.#getClassHierarchy(
        baseClassMd, firstParentClassMdWithParameters)) {

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
    const result = [...this.hierarchy()]
      .reverse()
      .map(o => o.name)
      .join('/')

    return result ? result : '/'
  }

  async *commands() { 
    const map = await this.#commands.load()
    yield* map.values()
  }
  async getCommand(nameOrNames = []) {
    const names = Array.isArray(nameOrNames) ? [...nameOrNames] : [nameOrNames]
      
    let current = this
    for (const name of names) {
      const commands = await current.#commands.load()
      current = commands.get(name)
      if (!current) throw new Error(`Command ${name} not found.`)
    }
    return current
  }

  get description() { return this.#classMd.description }
  get isDefaultCommand() { return !!this.#classMd.defaultCommand }
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
