import { LoadAsync } from '@kingjs/load'
import { Lazy, LazyGenerator } from '@kingjs/lazy'
import { IdentifierStyle } from '@kingjs/identifier-style'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliStdIn } from '@kingjs/cli-command'

const CLI_SCOPE = 'kingjs'
const CLI_SERVICE_PROVIDER = 'CliServiceProvider'

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
    this.#name = name
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
  get kababName() { 
    if (!this.name) return null
    const kababName = IdentifierStyle.from(this.name).toKebab()
    if (this.name == kababName) return null
    return kababName
  }

  toString() { 
    return `${this.name}, type=${this.infoType}` 
  }
}

export class CliParameterInfo extends CliInfo {

  #command
  #classMd
  #parameterMd
  #default

  constructor(command, name, classMd, parameterMd) {
    super(name, classMd.name, classMd.scope)
    this.#command = command
    this.#classMd = classMd
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

  get group() {
    const isService = CliClassMetadata.isSubclassOf(
      this.#classMd, CLI_SCOPE, CLI_SERVICE_PROVIDER)
  
    const group = this.#classMd.group 
      ?? (isService ? this.#classMd.baseClass?.group : null)
    return group
  }
  get scope() { return this.#classMd.scope }

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

  static async *runtimeParameters(command) {
    // walk command hierarchy yielding parameters; allow derived classes to 
    // override base class parameters; skip local inherited parameters
    const result = new Map()
    for await (const parameter of command.parameters()) {
      yield parameter
      result.set(parameter.name, parameter)
    }

    for (const current of command.parent?.hierarchy() ?? []) {
      for await (const parameter of current.parameters() ) {
        if (result.has(parameter.name)) continue
        if (parameter.isLocal) continue
        yield parameter
        result.set(parameter.name, parameter)
      }
    }
  }

  static *#classHierarchy(
    classMdStart, 
    classMdEndExclusive) {

    if (!classMdStart) return
    for (const current of classMdStart.hierarchy()) {
      if (current == classMdEndExclusive) return
      if (current.baren) continue
      yield current
    }

    if (!classMdEndExclusive) return
    throw new Error([
      `Class "${classMdEndExclusive.name}" not found`,
      `as base class of "${classMdStart.name}".`
    ].join(' '))
  }

  static *#servicePoset(classMd, visited, tree) {

    // yield all services in the poset of services
    for (const serviceMd of [...classMd.services()].reverse()) {
      if (serviceMd.baren) continue
      if (visited.has(serviceMd)) continue
      visited.add(serviceMd)
      const subTree = tree[serviceMd.name] = { }
      yield* CliCommandInfo.#servicePoset(serviceMd, visited, subTree)
      yield [serviceMd, subTree]
    }
  }

  #parent
  #classMd
  #commands
  #parameters
  #visitedMd
  #partitionMd
  #servicesMd
  #parameterTree

  constructor(parent, name, classMd) {
    super(name)

    this.#parent = parent
    this.#classMd = classMd
    this.#visitedMd = new Set(parent?.visitedMd$)

    // Load nested commands
    this.#commands = new Lazy(() => {
      const result = new Map()
      for (const [name, commandMd] of this.#classMd.commands()) {
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
    //    mytool: CliCommand -> MyTool
    //    post: CliCommand -> Web -> Http -> HttpPost
    // Filtering out those classes without parameters (assume MyTool and Web have none) 
    // and then partitioning by scope yields two sets, one for each scope:
    //    mytool: { CliCommand }
    //    post: { Http, HttpPost }
    // Hence the 'mytool' command would own all parameters on CliCommand (help, version, etc),
    // while the 'post' command would own all parameters on CliHttp (url, headers, etc)
    // and on Http (body, etc). Note that if we order the classes in the scope partitions
    // in the obvious way, then we get a set of classes: 
    //    CliCommand -> CliHttp -> HttpPost
    // which is a subset of target command's class hierarchy:
    //    CliCommand -> Web -> Http -> HttpPost
    // In this way the scope hierarchy is a partition of the subset of the class hierarchy
    // which have parameters. Hence, both hierarchies share the same parameter set.
    this.#partitionMd = [
      ...CliCommandInfo.#classHierarchy(
        this.#classMd, this.parent?.partitionMd$[0])
    ]

    this.#servicesMd = []

    if (this.name == 'poll') {
      this.#parameterTree = {
        Cli: [],
        CliCommand: [],
        CliDaemon: {
          CliDaemonState: {
            CliStdLog: [ 'stdlog' ]
          },
          CliPulse: [{
            CliStdIn: [ 'stdin' ],
            CliStdOut: [ 'stdout' ],
            CliStdErr: [ 'stderr' ]
          }, 'reportMs', 'intervalMs' ],
        },
        CliRx: { },
        CliRxPoller: [ 'writeError', 'errorMs', 'errorRate', 'pollMs' ],
        CliPollClipboard: [ 'prefix' ],
      }
    }
    this.#parameterTree = { }

    this.#parameters = new Lazy(() => {
      const slots = new Map()
      const result = []

      for (const classMd of this.#partitionMd.reverse()) {
        const tree = this.#parameterTree[classMd.name] = { }

        // Gather parameters from the service poset
        for (const [serviceMd, subTree] of
          CliCommandInfo.#servicePoset(classMd, this.#visitedMd, tree)) {
          this.#servicesMd.push(serviceMd)

          for (const parameterMd of [...serviceMd.parameters()].reverse()) {
            const name = parameterMd.name
            if (slots.has(name))
              throw new Error([
                `Parameter "${name}" in service "${serviceMd.name}"`,
                `conflicts with parameter in class "${this.#classMd.name}".`
              ].join(' '))
            const parameter = new CliParameterInfo(this, name, serviceMd, parameterMd)
            subTree[name] = parameter.group ?? '.'
            slots.set(name, parameter)
            result.push(parameter)
          }
        }

        // Gather parameters from the class hierarchy
        for (const parameterMd of [...classMd.parameters()].reverse()) {
          const name = parameterMd.name
          if (classMd != this.#classMd) {
            if (slots.has(name)) continue
            if (parameterMd.local) continue
          }
          const parameter = new CliParameterInfo(this, name, classMd, parameterMd)
          tree[name] = parameter.group ?? '.'
          slots.set(name, parameter)
          result.push(parameter)
        }
      }

      return result.reverse()
    })
  }

  get isCommand() { return true }

  get parent() { return this.#parent }
  get classMd$() { return this.#classMd }
  get servicesMd$() { return this.#servicesMd }
  get visitedMd$() { return this.#visitedMd }
  get partitionMd$() { return this.#partitionMd }
  get __comment() {
    return {
      parameters: [...this.parameters()].map(o => o.name),
      groups: this.#parameterTree,
      partition: this.#partitionMd.map(o => o.name),
      services: this.#servicesMd.map(o => o.name),
    }
  }

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

  *commands() { 
    yield* this.#commands.value.values()
  }
  getCommand(...names) {
    if (names.length == 0)
      return this

    const [name, ...rest] = names
    const commands = this.#commands.value
    const command = commands.get(name)
    if (!command) throw new Error(`Command ${name} not found.`)
    return command.getCommand(...rest)
  }
  async getRuntimeCommand(...kebabNames) {
    const names = kebabNames.map(o => IdentifierStyle.fromKebab(o).toCamel())
    return this.getCommand(...names) 
  }

  get description() { return this.#classMd.description }
  get isDefaultCommand() { return !!this.#classMd.defaultCommand }
  *parameters() { yield* this.#parameters.value }
  *positionals() { yield* this.parameters().filter(o => o.isPositional) }
  *options() { yield* this.parameters().filter(o => o.isOption) }

  async getRuntimeArgs(argv) {
    // Assume argv is an object generated by a cli frameworke like yargs;
    // Assume argv matches the values entered on the command line;
    // Assume argv properties are in kabab case and positional args are named.
    // Return an array of positional arguments with an additional last element
    // which is an object containing the option arguments with names converted
    // to camel case.
    const result = []
    const options = { }

    const parameters = await Array.fromAsync(CliCommandInfo.runtimeParameters(this))
    for (const parameter of [...parameters].sort((a, b) => a.position - b.position)) {
      const { name, kababName$, isPositional } = parameter
      const kababName = kababName$ ?? name
      if (isPositional) {
        result.push(argv[kababName])
      } else if (Object.hasOwn(argv, kababName)) {
        options[name] = argv[kababName]
      }
    }
    result.push(options)

    return result
  }

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
