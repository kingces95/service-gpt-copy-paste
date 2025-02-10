import _ from 'lodash'
import { Lazy, LazyGenerator } from '@kingjs/lazy'
import assert from 'assert'

class CliMetaInfo {
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

  toString() { return this.name }
}

class CliMetaParameterInfo extends CliMetaInfo {

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
    this.type$ = CliMetaParameterInfo.getType(dfault)
  }

  get classInfo() { return this.classInfo$ }
  get isParameter() { return true }
  get isOption() { return !this.isPositional }
  get isPositional() { return this.position != undefined }

  get description() { return this.classInfo.cls$?.parameters?.[this.name] }
  get normalize() { this.classInfo.cls$?.normalize?.[this.name] }

  get default() { return this.default$ }
  get hasDefault() { return this.hasDefault$ } 
  get require() { return !this.hasDefault } 
  get defaultDescription() { return this.classInfo.cls$?.defaultDescription?.[this.name] }
  get coerce() { return this.classInfo.cls$?.coerce?.[this.name] }

  get type() { return this.type$ }
  get isArray() { return this.type === 'array' }
  get isString() { return this.type === 'string' } 
  get isBoolean() { return this.type === 'boolean' }
  get isNumber() { return this.type === 'number' } 
  get isCount() { return this.type === 'count' } 
  
  *aliases() { yield* this.classInfo.cls$?.aliases?.[this.name] ?? [] }
  *choices() { yield* this.classInfo.cls$?.choices?.[this.name] ?? [] }
  *conflicts() { yield* this.classInfo.cls$?.conflicts?.[this.name] ?? [] }
  *implications() { yield* this.classInfo.cls$?.implications?.[this.name] ?? [] }

  // CliClassOptionInfo
  get local() { return this.classInfo.cls$?.local?.[this.name] } 
  get hidden() { return this.classInfo.cls$?.hidden?.[this.name] } 

  // CliClassPositionalInfo
  get position() { return undefined }

  toString() { return `${super.toString()} : ${this.classInfo.toString()}` }
}

class CliMetaOptionInfo extends CliMetaParameterInfo {
  constructor(classInfo, name, dfault) {
    super(classInfo, name, dfault)
  }

  get isOption() { return true } 

  toString() { return `option/${this.type} ${super.toString()}` }
}

class CliMetaPositionalInfo extends CliMetaParameterInfo {
  constructor(classInfo, name, dfault, position) {
    super(classInfo, name, dfault)

    this.position$ = position
  }

  get isPositional() { return true }
  get position() { return this.position$ }

  toString() { return `positional ${super.toString()}` }
}

class CliMetaClassInfo extends CliMetaInfo {
  static commonAncestor(classes) {
    const hierarchies = classes.map(cls => [...cls.hierarchy()].reverse())
    const commonAncestors = _.intersection(...hierarchies)
    const result = commonAncestors[commonAncestors.length - 1]
    return result
  }

  constructor(loader, cls, defaults = [{ }]) {
    super(loader, cls.name)
    this.cls$ = cls

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

    this.commands$ = Object.hasOwn(cls, 'commands') ? cls.commands : null

    this.positionals$ = new LazyGenerator(function* () {
      const names = Object.keys(cls.parameters)
      for (let i = 0; i < defaults.length - 1; i++) {
        const name = names[i]
        yield new CliMetaPositionalInfo(this, name, defaults[i], i)
      }
    }, this)

    this.options$ = new LazyGenerator(function* () {
      const options = defaults[defaults.length - 1]
      for (const [name, dfault] of Object.entries(options)) {
        yield new CliMetaOptionInfo(this, name, dfault)
      }
    }, this)

    this.parameters$ = new LazyGenerator(function* () {
      yield* this.positionals()
      yield* this.options()
    }, this)
  }

  get isClass() { return true }

  get baseClass() { return this.baseClass$.value }
  get description() { return this.cls$.description }
  get commands() { return this.commands$ }

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

class CliMetaLoader {
  constructor() {
    this.cache$ = null
    this.Cli$ = null
  }

  get Cli() { return this.Cli$ }
  *classes() { yield *this.cache$.values() }

  load(cls, defaults) {  
    if (!cls) {
      return null
    }

    // bootstrap
    if (!this.cache$) {
      assert(cls.name == 'Cli')
      this.cache$ = new Map()
      this.Cli$ = new CliMetaClassInfo(this, cls, defaults)
      this.cache$.set(cls, this.Cli$)
      return this.cache$.get(cls)
    }

    const Cli = this.Cli.cls$
    if (cls !== Cli && !(cls.prototype instanceof Cli)) {
      return null
    }

    if (!this.cache$.has(cls)) {
      assert(defaults)
      this.cache$.set(cls, new CliMetaClassInfo(this, cls, defaults))
    }

    return this.cache$.get(cls)
  }
}

export {
  CliMetaInfo,
  CliMetaParameterInfo,
  CliMetaClassInfo,
  CliMetaLoader
}
