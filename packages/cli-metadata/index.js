import _ from 'lodash'
import { LazyGenerator } from '@kingjs/lazy'
import { Cli } from '@kingjs/cli'
import { NodeName } from '@kingjs/node-name'
import { assert } from 'vitest'

const PARAMETER_METADATA_NAMES =  [ 
  // arrays
  'aliases', 'choices', 'conflicts', 'implications',
  // functions
  'coerce',
  // strings
  'defaultDescription', 
  // booleans
  'hidden', 'local', 'normalize'
]

class CliMetadata {
  constructor(loader, name) {
    this.loader = loader
    this.name = name
  }

  get isParameter() { return false }
  get isPositional() { return false }
  get isOption() { return false }
  get isClass() { return false }

  toString() { return `name=${this.name}` }
}

class CliParameterMetadata extends CliMetadata {

  static getType(default$) {
    if (default$ === null) {
      return 'string'
    } else if (Array.isArray(default$)) { 
      return 'array'
    } else if (default$ == String) {
      return 'string'
    } else if (default$ == Number) {
      return 'number'
    } else if (default$ == Boolean) {
      return 'boolean'
    } else if (default$ == Array) {
      return 'array'
    } else {
      const defaultType = typeof default$
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

  constructor(classInfo, name, default$) {
    super(classInfo.loader, name)

    this.name = name
    this.classInfo$ = classInfo
    this.default$ = default$
    this.hasDefault$ = default$ !== undefined
    this.type$ = CliParameterMetadata.getType(default$)
    this.metadata = classInfo.getParameterMetadata$(name)
  }

  get classInfo() { return this.classInfo$ }
  get isParameter() { return true }

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
  constructor(classInfo, name, default$) {
    super(classInfo, name, default$)
  }

  get isOption() { return true } 

  toString() { return `option, type=${this.type}, ${super.toString()}` }
}

class CliPostionalMetadata extends CliParameterMetadata {
  constructor(classInfo, name, default$, position) {
    super(classInfo, name, default$)

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
  
  #baseClass
  #hierarchy
  #positionals
  #options
  #parameters
  #commands

  constructor(loader, class$, { scope, nodeName, name }) {
    // nodeName or scope + name must be provided, but not both
    assert(nodeName || (scope && name))
    assert(!(nodeName && scope && name))

    super(loader, name)

    this.class = class$
    this.scope = scope
    this.nodeName = nodeName
    this.description = this.#getOwnClassMetadata('description')
    this.commandNames = Object.keys(this.#getOwnClassMetadata('commands') ?? { })
    
    const parameters = this.#getOwnClassMetadata('parameters') ?? { }
    const defaults = this.#getOwnClassMetadata('defaults') ?? [{ }]

    this.#commands = new LazyGenerator(async function* () {
      const commands = this.getOwnClassMetadata$('commands') ?? { }
      for (const [name, id] of Object.entries(commands)) {
        const class$ = await this.#loadCommandClass([name, id])
        yield new CliClassMetadata(this.loader, class$, { name, scope: this })
      }
    }, this)

    this.#positionals = new LazyGenerator(function* () {
      const names = Object.keys(parameters)
      for (let i = 0; i < defaults.length - 1; i++) {
        const name = names[i]
        yield new CliPostionalMetadata(this, name, defaults[i], i)
      }
    }, this)

    this.#options = new LazyGenerator(function* () {
      const options = defaults[defaults.length - 1]
      for (const [name, default$] of Object.entries(options)) {
        yield new CliOptionMetadata(this, name, default$)
      }
    }, this)

    this.#parameters = new LazyGenerator(function* () {
      yield* this.positionals()
      yield* this.options()
    }, this)
    
    this.#baseClass = new Lazy(() => {
      return loader.load(class$.prototype)
    })

    this.#hierarchy = new LazyGenerator(function* () {
      let current = this
      while (current) {
        yield current
        current = current.baseClass
      }
    }, this)
  }

  async #loadCommandClass(entry) {
    const [name, value] = entry

    // 1) if entry is a Cli class, then return it
    // e.g. CliEcho
    if (typeof value == 'function') {
      if (value.prototype instanceof Cli) {
        return value
      }
    }

    // 2) if entry is a reference to a type, then lazily load it
    // e.g '@kingjs/echo, CliEcho'; fully qualified name
    // e.g 'CliEcho'; short name
    if (typeof value == 'string') {
      const scope = this.nodeName.moduleName
      const typeName = await NodeName.from(value, scope)
      return await typeName.getType()
    }

    // 3) if the entry is a pojo, then dynamically create a command class
    // e.g. { description: '...', ... }
    if (typeof value == 'object') {
      if (Object.getPrototypeOf(value) == Object.prototype) {
        return Cli.extend({ 
          name: TypeName.scopeToTypeCase(name), 
          ...value 
        })
      }
    }

    new Error(`Could not load command ${name} found on ${className}`)  
  }

  #getOwnClassMetadata(metadataName) {
    return Object.hasOwn(this.class, metadataName) 
      ? this.class[metadataName] : null
  }

  #getParameterMetadata(parameterName) {
    return PARAMETER_METADATA_NAMES.reduce((acc, metadataName) => {
      const metadata = this.#getOwnClassMetadata(metadataName)
      const metadatum = metadata?.[parameterName]
      acc[metadataName] = metadatum
      return acc  
    }, { })
  }

  get isClass() { return true }

  get nodeName() {
    if (this.nodeName)
      return this.nodeName

    if (this.scope)
      return this.scope.nodeName.addNesting(this.name)

    return null
  }
  get baseClass() { return this.#baseClass.value }
  
  async commands() { return await this.#commands.load() }

  *hierarchy() { yield* this.#hierarchy.value }
  *positionals() { yield* this.#positionals.value }
  *options() { yield* this.#options.value }
  *parameters() { yield* this.#parameters.value }
  
  isSubClassOf(classMetadata) {
    if (!classMetadata)
      return false
    return this.class.prototype instanceof classMetadata.class
  }

  activate(args) { new this.class(args) }
}

class CliMetadataLoader {
  
  constructor(cli) {
    const cliName = NodeName.from('@kingjs/cli, Cli')
    this.cli = new CliClassMetadata(this, cli, { nodeName: cliName })
    this.#metadataByName = new Map()
  }

  #metadataByName

  async getType(name) {
    const nodeName = NodeName.from(name)
    const key = nodeName.qualifiedName
    if (!this.#metadataByName.has(key)) {
      const class$ = await nodeName.getType()
      const metadata = new CliClassMetadata(this, class$, { nodeName })
      this.#metadataByName.set(key, metadata)
    }
    return this.#metadataByName.get(key)
  }
}

const cliMetadataLoader = new CliMetadataLoader()

export {
  cliMetadataLoader,
  CliMetadataLoader,

  CliMetadata,

  CliClassMetadata,

  CliParameterMetadata,
  CliOptionMetadata,
  CliPostionalMetadata,
}
