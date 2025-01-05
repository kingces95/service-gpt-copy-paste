import _ from 'lodash'
import { Cli } from '@kingjs/cli'

class Lazy {
  static fromGenerator(generator, scope) {
    return new Lazy(() => [...generator.call(scope)])
  }

  constructor(load) {
    this.load = load
  }

  get value() {
    if (!this.value$) {
      this.value$ = this.load()
    }
    return this.value$
  }
}

class CliInfo {
  constructor(loaderOrNull, name) {
    this.loader$ = loaderOrNull ?? this
    this.name$ = name
  }

  get loader() { return this.loader$ }
  get name() { return this.name$ }

  toString() { return this.name }
}

class CliParameterInfo extends CliInfo {
  constructor(classInfo, name, metadata) { 
    super(classInfo.loader, name)

    this.classInfo = classInfo
    this.metadata = metadata
  }
  
  get aliases() { return this.metadata.aliases }
  get choices() { return this.metadata.choices }
  get coerce() { return this.metadata.coerce }
  get conflicts() { return this.metadata.conflicts }
  get default() { return this.metadata.default }
  get defaultDescription() { return this.metadata.defaultDescription }
  get describe() { return this.metadata.describe }
  get implies() { return this.metadata.implies }
  get normalize() { return this.metadata.normalize }
  get type() { return this.metadata.type }
}

class CliPositionalInfo extends CliParameterInfo {
  constructor(classInfo, metadata) { 
    super(classInfo, metadata.name, metadata)
  }
}

class CliOptionInfo extends CliParameterInfo {  
  constructor(classInfo, name, metadata) { 
    super(classInfo, name, metadata)
  }
  
  get boolean() { return this.metadata.boolean }
  get count() { return this.metadata.count } 
  get demandOption() { return this.metadata.demandOption } 
  get global() { return this.metadata.global } 
  get hidden() { return this.metadata.hidden } 
  get number() { return this.metadata.number } 
  get string() { return this.metadata.string } 
}

class CliClassInfo extends CliInfo {
  constructor(loader, cls) {
    super(loader, cls.name)
    this.cls$ = cls
    
    this.description$ = new Lazy(() => cls.metadata.description)
    
    this.metadata$ = new Lazy(
      () => cls.hasOwnProperty('metadata') ? cls.metadata : null
    )

    this.hierarchy$ = Lazy.fromGenerator(function* () {
      let current = this
      while (current) {
          yield current
          current = current.baseClass
      }
    }, this)
    
    this.positionals$ = new Lazy(() => {
      return this.metadata?.arguments?.map(argument =>
        this.loader.loadPositional(this, argument)) || []
    })

    this.options$ = new Lazy(() => {
      return Object.entries(this.metadata?.options ?? { })
        .map(([name, metadata]) => this.loader.loadOption(this, name, metadata))
    })

    this.baseClass$ = new Lazy(
      () => this.loader.loadClass(Object.getPrototypeOf(cls.prototype)?.constructor)
    )
  }

  get metadata() { return this.metadata$.value }
  get baseClass() { return this.baseClass$.value }
  get description() { return this.description$.value }
  
  *positionals() { yield* this.positionals$.value }
  *options() { yield* this.options$.value }
  *hierarchy() { yield* this.hierarchy$.value }
}

class CliMemberInfo extends CliInfo {
  constructor(loaderOrNull, name, parent) {
    super(loaderOrNull, name)

    this.parent = parent
    
    this.positionals$ = Lazy.fromGenerator(function* () {
      for (const classInfo of this.classInfo.hierarchy()) {
        yield* classInfo.positionals()
      }
    }, this)

    this.options$ = Lazy.fromGenerator(function* () {
      for (const classInfo of this.classInfo.hierarchy()) {
        if (classInfo === this.parent?.classInfo) 
          break
        yield* classInfo.options()
      }
    }, this)
  }

  get isGroup() { return false }
  get isCommand() { return false }
  get classInfo() { throw new Error() }
  get description() { return this.classInfo.description }

  *members() { }
  *commands() { }
  *groups() { }
  *positionals() { yield* this.positionals$.value }
  *options() { yield* this.options$.value }
}

class CliCommandInfo extends CliMemberInfo {
  constructor(loader, cls, name, parent) {
    super(loader, name, parent)

    this.classInfo$ = new Lazy(() => this.loader.loadClass(cls))
  }

  get isCommand() { return true }
  get classInfo() { return this.classInfo$.value }

  toString() { return this.classInfo.name }
}

class CliGroupInfo extends CliMemberInfo {
  static isClsOrGroup(name) {
    return !name.endsWith('$')
  }

  constructor(loaderOrNull, group, name, parent) {
    super(loaderOrNull, name, parent)

    this.members$ = new Lazy(() => {
      return Object.entries(group)
        .filter(([name]) => CliGroupInfo.isClsOrGroup(name))
        .map(([name, clsOrGroup]) => this.loader.loadMember(this.loader, clsOrGroup, name, this))
    })

    this.classInfo$ = new Lazy(() => {
      const members = [...this.members()]
      if (!members.length) {
        return this.loader.Cli
      }

      const classes = [...members.map(member => member.classInfo.baseClass || this.loader.Cli)]
      const hierarchies = classes.map(cls => [...cls.hierarchy()].reverse())
      const commonAncestors = _.intersection(...hierarchies)
      return commonAncestors[commonAncestors.length - 1]
    })

    this.description$ = new Lazy(() => group.description$ || super.description)
  }

  get isGroup() { return true }
  get classInfo() { return this.classInfo$.value }
  get description() { return this.description$.value }
  
  *members() { yield* this.members$.value }
}

class CliLoader extends CliGroupInfo {
  constructor(metadata) {
    super(null, metadata, null, null)

    this.cache$ = new Map()
    this.Cli$ = new Lazy(() => this.loadClass(Cli)) 
  }

  get Cli() { return this.Cli$.value }

  loadPositional(classInfo, metadata) {
    return new CliPositionalInfo(classInfo, metadata)
  }

  loadOption(classInfo, name, metadata) {
    return new CliOptionInfo(classInfo, name, metadata)
  }

  loadMember(loader, clsOrGroup, name, parent) {
    if (typeof clsOrGroup === 'function') {
      return new CliCommandInfo(loader, clsOrGroup, name, parent)
    } 
    
    if (typeof clsOrGroup === 'object') {
      return new CliGroupInfo(loader, clsOrGroup, name, parent)
    } 
  
    throw new Error(`Invalid metadata type: ${clsOrGroup}`)
  }

  loadClass(cls) {
    if (!cls) {
      return null
    }

    if (cls != Cli && !(cls.prototype instanceof Cli)) {
      return null
    }

    if (!this.cache$.has(cls)) {
      this.cache$.set(cls, new CliClassInfo(this, cls))
    }

    return this.cache$.get(cls)
  }
}

export {
  CliInfo,
  CliParameterInfo,
  CliOptionInfo,
  CliPositionalInfo,
  CliClassInfo,
  CliMemberInfo,
  CliCommandInfo,
  CliGroupInfo,
  CliLoader
}
