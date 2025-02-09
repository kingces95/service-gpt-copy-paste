import { LoadAsync } from '@kingjs/load'
import { parseModuleName, parseTypeName } from '@kingjs/node-name-parse'

class NodeName {
  constructor(identifier, parts, segments, path) {
    if (new.target === NodeName) {
      throw new Error("Cannot instantiate abstract class NodeName.")
    }
    this.identifier = identifier
    this.parts = parts
    this.segments = segments
    this.path = path
  }

  async load() {
    throw new Error("Abstract method 'load' must be implemented.")
  }

  toString() {
    return this.identifier
  }
}

export class ModuleName extends NodeName {
  static async load(identifier) {
    return ModuleName.construct(identifier).load()
  }

  static construct(identifier) {
    return new ModuleName(parseModuleName(identifier))
  }

  constructor(parts) {
    const { scope, segments } = parts
    const path = segments.join('/')
    const identifier = (scope ? [scope, '/', path] : [path]).join('')
    super(identifier, parts, segments, path)

    this.scope = scope
    this.module$ = new LoadAsync(async () => await import(this.identifier))
  }

  async load() {
    return await this.module$.load()
  }

  isScoped() {
    return this.scope !== null
  }
}

export class TypeName extends NodeName {
  static async load(identifier, options) {
    return TypeName.construct(identifier).load(options)
  }

  static construct(identifier) {
    return new TypeName(parseTypeName(identifier))
  }
  
  constructor(parts) {
    const { module: moduleParts, segments } = parts  
    const moduleName = new ModuleName(moduleParts)
    const path = segments.join('.')
    const identifier = [moduleName.identifier, path].join(' ')
    super(identifier, parts, segments, path)

    this.moduleName = moduleName
    this.type$ = new LoadAsync(async () => {
      const module = await this.moduleName.load()
      
      if (this.isDefault) {
        return module.default
      }
      
      // Resolve the class using property access
      let resolvedClass = module
      for (const segment of this.segments) {
        if (!(segment in resolvedClass)) {
          return null
        }
        resolvedClass = resolvedClass[segment]
      }

      return resolvedClass
    })
  }

  get isDefault() {
    return !this.path
  }

  async load(options = { typeMissingIsError: true }) {
    const resolved = await this.type$.load()
    if (options.typeMissingIsError && !resolved) {
      throw new Error(`Class path "${this.identifier}" not found.`)
    }
    return resolved
  }
}
