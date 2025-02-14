import _ from 'lodash'
import { Lazy, LazyGenerator } from '@kingjs/lazy'
import { Cli } from '@kingjs/cli'
import { TypeName } from '@kingjs/node-name'

const PARAMETER_METADATA_NAMES =  [ 
  // arrays
  'aliases', 'choices', 'commands', 'conflicts', 'implications', 
  // functions
  'coerce',
  // strings
  'defaultDescription', 
  // booleans
  'hidden', 'local', 'normalize'
]

class CliMetadata {
  constructor(loader, name) {
    this.loader$ = loader
    this.name$ = name
  }

  get isParameter() { return false }
  get isPositional() { return false }
  get isOption() { return false }
  get isClass() { return false }

  get loader() { return this.loader$ }
  get name() { return this.name$ }
  get description() { throw new Error('abstract') }

  toString() { return `name=${this.name}` }
}

class CliParameterMetadata extends CliMetadata {

  static getType(dfault) {
    if (dfault === null) {
      return 'string'
    } else if (Array.isArray(dfault)) { 
      return 'array'
    } else if (dfault == String) {
      return 'string'
    } else if (dfault == Number) {
      return 'number'
    } else if (dfault == Boolean) {
      return 'boolean'
    } else if (dfault == Array) {
      return 'array'
    } else {
      const defaultType = typeof dfault
      if (defaultType === 'string') {
        return 'string'
      } else if (defaultType == 'number') {
        return 'number'
      } else if (defaultType == 'boolean') {
        return 'boolean'
      }
    }

    return 'string'
  }

  constructor(classInfo, name, dfault) {
    super(classInfo.loader, name)

    this.classInfo$ = classInfo
    this.default$ = dfault
    this.hasDefault$ = dfault !== undefined
    this.type$ = CliParameterMetadata.getType(dfault)
    this.metadata = classInfo.getParameterMetadata$(name)
  }

  get classInfo() { return this.classInfo$ }
  get isParameter() { return true }
  get isOption() { return !this.isPositional }
  get isPositional() { return this.position != undefined }

  // parameter type
  get type() { return this.type$ }
  get isArray() { return this.type === 'array' }
  get isString() { return this.type === 'string' } 
  get isBoolean() { return this.type === 'boolean' }
  get isNumber() { return this.type === 'number' } 
  get isCount() { return this.type === 'count' } 
  get normalize() { return this.metadata.normalize } // TODO: make path 1st class
  get coerce() { return this.metadata.coerce }
  
  get description() { return this.metadata.description }

  // default/require/optional
  get default() { return this.default$ }
  get hasDefault() { return this.hasDefault$ } 
  get require() { return !this.hasDefault } 
  get defaultDescription() { return this.metadata.defaultDescription }

  // CliClassOptionInfo
  get local() { return this.metadata.local }
  get hidden() { return this.metadata.hidden }

  *aliases() { yield* this.metadata.aliases ?? [] }
  *choices() { yield* this.metadata.choices ?? [] }
  *conflicts() { yield* this.metadata.conflicts ?? [] }
  *implications() { yield* this.metadata.implications ?? [] }

  // CliClassPositionalInfo
  get position() { return undefined }

  toString() { return `${super.toString()}, class={ ${this.classInfo.toString() }}` }
}

class CliOptionMetadata extends CliParameterMetadata {
  constructor(classInfo, name, dfault) {
    super(classInfo, name, dfault)
  }

  get isOption() { return true } 

  toString() { return `option, type=${this.type}, ${super.toString()}` }
}

class CliPostionalMetadata extends CliParameterMetadata {
  constructor(classInfo, name, dfault, position) {
    super(classInfo, name, dfault)

    this.position$ = position
  }

  get isPositional() { return true }
  get position() { return this.position$ }

  toString() { return `positional, ${super.toString()}` }
}

class CliClassMetadata extends CliMetadata {
  static commonAncestor(classes) {
    const hierarchies = classes.map(cls => [...cls.hierarchy()].reverse())
    const commonAncestors = _.intersection(...hierarchies)
    const result = commonAncestors[commonAncestors.length - 1]
    return result
  }

  constructor(loader, name, cls) {
    super(loader, name)
    this.class$ = cls

    const parameters = this.getOwnClassMetadata$('parameters') || { }
    const defaults = this.getOwnClassMetadata$('defaults') || [{ }]

    this.meta = this.class.meta

    this.fullName$ = new Lazy(() => this.class.fullName())
    this.url$ = new Lazy(() => this.class.url())
    this.typeName$ = new Lazy(() => this.class.typeName())
    this.moduleName$ = new Lazy(() => this.class.moduleName())

    this.description$ = this.getOwnClassMetadata$('description')
    this.commands$ = new Lazy(() => {
      const commands = this.getOwnClassMetadata$('commands') ?? { }
      const result = { }
      for (const [name, cls] of Object.entries(commands)) {
        if (cls instanceof Cli) { result[name] = loader.load(cls) } // early
        if (typeof cls === 'string') { result[name] = TypeName.from(cls) } // late
        if (typeof cls === 'object') { result[name] = Cli.extend(cls) } // anonymous
      }
      return result
    })

    this.hierarchy$ = new LazyGenerator(function* () {
      let current = this
      while (current) {
        yield current
        current = current.baseClass
      }
    }, this)

    this.baseClass$ = new Lazy(
      () => this.loader.load(Object.getPrototypeOf(cls.prototype)?.constructor)
    )

    this.positionals$ = new LazyGenerator(function* () {
      const names = Object.keys(parameters)
      for (let i = 0; i < defaults.length - 1; i++) {
        const name = names[i]
        yield new CliPostionalMetadata(this, name, defaults[i], i)
      }
    }, this)

    this.options$ = new LazyGenerator(function* () {
      const options = defaults[defaults.length - 1]
      for (const [name, dfault] of Object.entries(options)) {
        yield new CliOptionMetadata(this, name, dfault)
      }
    }, this)

    this.parameters$ = new LazyGenerator(function* () {
      yield* this.positionals()
      yield* this.options()
    }, this)
  }

  async fullName() { return await this.fullName$.value }
  async url() { return await this.url$.value }
  async typeName() { return await this.typeName$.value }
  async moduleName() { return await this.moduleName$.value }

  getOwnClassMetadata$(metadataName) {
    return Object.hasOwn(this.class, metadataName) ? this.class[metadataName] : null
  }

  getParameterMetadata$(parameterName) {
    return PARAMETER_METADATA_NAMES.reduce((acc, metadataName) => {
      const metadata = this.getOwnClassMetadata$(metadataName)
      const metadatum = metadata?.[parameterName]
      acc[metadataName] = metadatum
      return acc  
    }, { })
  }

  get isClass() { return true }
  
  get class() { return this.class$ }
  get baseClass() { return this.baseClass$.value }
  get description() { return this.description$.value }
  get commands() { return this.commands$.value }

  *parameters() { yield* this.parameters$.value }
  *positionals() { yield* this.positionals$.value }
  *options() { yield* this.options$.value }
  *hierarchy() { yield* this.hierarchy$.value }

  isSubClassOf(classMetadata) {
    if (!classMetadata)
      return false
    return this.class.prototype instanceof classMetadata.class
  }

  activate(args) { new this.class(args) }
}

class CliMetadataLoader {
  constructor() {
    this.cache$ = new Map()
  }

  get Cli() { return this.load(Cli) }
  *classes() { yield *this.cache$.values() }

  load(cls) {
    if (!cls)
      return null

    if (cls !== Cli && !(cls.prototype instanceof Cli))
      return null

    if (!this.cache$.has(cls))
      this.cache$.set(cls, new CliClassMetadata(this, cls.name, cls))

    return this.cache$.get(cls)
  }
}

const loader = new CliMetadataLoader()

export {
  loader,
  CliMetadata,
  CliParameterMetadata,
  CliClassMetadata,
  CliMetadataLoader
}
