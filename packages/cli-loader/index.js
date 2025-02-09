import _ from 'lodash'
import { Cli } from '@kingjs/cli'
import Lazy from '@kingjs/lazy'

class CliLoaderInfo {
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

  toString() { return this.name }
}

class CliClassParameterInfo extends CliLoaderInfo {
  constructor(classInfo, metadata, name) {
    super(classInfo.loader, name)

    this.classInfo = classInfo
    this.metadata = metadata
  }

  get isParameter() { return true }

  get type() { return this.metadata.type }
  get isArray() { return this.type === 'array' }
  get isString() { return this.type === 'string' } 
  get isBoolean() { return this.type === 'boolean' }
  get isNumber() { return this.type === 'number' } 
  get isCount() { return this.type === 'count' } 

  get aliases() { return this.metadata.aliases }
  get choices() { return this.metadata.choices }
  get coerce() { return this.metadata.coerce }
  get conflicts() { return this.metadata.conflicts }
  get default() { return this.metadata.default }
  get defaultDescription() { return this.metadata.defaultDescription }
  get description() { return this.metadata.description }
  get implies() { return this.metadata.implies }
  get normalize() { return this.metadata.normalize }

  toString() { return `${super.toString()} : ${this.classInfo.toString()}` }
}

class CliClassOptionInfo extends CliClassParameterInfo {
  constructor(classInfo, metadata, name) {
    super(classInfo, metadata, name)
  }

  get isOption() { return true }

  get demandOption() { return this.metadata.demandOption } 
  get global() { return this.metadata.global } 
  get hidden() { return this.metadata.hidden } 

  toString() { return `option/${this.type} ${super.toString()}` }
}

class CliClassPositionalInfo extends CliClassParameterInfo {
  constructor(classInfo, metadata, name, position) {
    super(classInfo, metadata, name)

    this.position = position
  }

  get isPositional() { return true }

  toString() { return `positional ${super.toString()}` }
}

class CliClassInfo extends CliLoaderInfo {
  static commonAncestor(classes) {
    const hierarchies = classes.map(cls => [...cls.hierarchy()].reverse())
    const commonAncestors = _.intersection(...hierarchies)
    const result = commonAncestors[commonAncestors.length - 1]
    return result
  }

  constructor(loader, cls) {
    super(loader, cls.name)
    this.cls$ = cls

    this.description$ = new Lazy(() => this.metadata?.description)

    this.metadata$ = new Lazy(
      // harvest metadata declared on the class; do not inherit metadata
      () => cls.hasOwnProperty('metadata') ? cls.metadata : null
    )

    this.hierarchy$ = Lazy.fromGenerator(function* () {
      let current = this
      while (current) {
        yield current
        current = current.baseClass
      }
    }, this)

    this.positionals$ = Lazy.fromGenerator(function* () {
      for (const [i, argument] of (this.metadata?.arguments ?? []).entries()) {
        yield new CliClassPositionalInfo(this, argument, argument.name, i)
      }
    }, this)

    this.options$ = Lazy.fromGenerator(function* () {
      for (const [name, metadata] of Object.entries(this.metadata?.options ?? {})) {
        yield new CliClassOptionInfo(this, metadata, name)
      }
    }, this)

    this.parameters$ = Lazy.fromGenerator(function* () {
      yield* this.positionals()
      yield* this.options()
    }, this)

    this.baseClass$ = new Lazy(
      () => this.loader.load(Object.getPrototypeOf(cls.prototype)?.constructor)
    )
  }

  get isClass() { return true }

  get metadata() { return this.metadata$.value }
  get baseClass() { return this.baseClass$.value }
  get description() { return this.description$.value }

  *parameters() { yield* this.parameters$.value }
  *positionals() { yield* this.positionals$.value }
  *options() { yield* this.options$.value }
  *hierarchy() { yield* this.hierarchy$.value }

  isSubClassOf(cls) {
    if (!cls)
      return false
    return this.cls$.prototype instanceof cls.cls$
  }

  activate(args) { new this.cls$(args) }
}

class CliLoader {
  constructor() {
    this.cache$ = new WeakMap()
    this.Cli$ = new Lazy(() => this.load(Cli))
  }

  get Cli() { return this.Cli$.value }

  load(cls) {
    if (!cls) {
      return null
    }

    if (cls !== Cli && !(cls.prototype instanceof Cli)) {
      return null
    }

    if (!this.cache$.has(cls)) {
      this.cache$.set(cls, new CliClassInfo(this, cls))
    }

    return this.cache$.get(cls)
  }
}

export {
  CliLoaderInfo,
  CliClassParameterInfo,
  CliClassOptionInfo,
  CliClassPositionalInfo,
  CliClassInfo,
  CliLoader
}
