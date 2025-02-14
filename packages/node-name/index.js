import { URL } from 'url'

async function __import() {
  const { nodeNameToPojo } = await import('@kingjs/node-name-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: nodeNameToPojo, dumpPojo }
}

export const SCHEME = 'node://'
export const HOST = 'nodejs.org'
export const GLOBAL = 'global'
export const LOCAL = 'local'

export class NodeName {
  async __dump() { 
    const { toPojo, dumpPojo } = await __import()
    toPojo(this).then(dumpPojo) 
  }

  static assertAlphanumeric(...values) {
    if (values.some(v => !/^[a-zA-Z0-9-_]+$/.test(v))) {
      throw new Error(`Values must be alphanumeric, including '-' and '_'; got "${values.join(', ')}".`)
    }
  }

  constructor(id, parts, segments, path) {
    if (new.target === NodeName) {
      throw new Error("Cannot instantiate abstract class NodeName.")
    }
    this.parts = parts
    this.segments = segments
    this.path = path
    this.url = new URL(id)
    this.id = this.url.toString()
  }

  toString() {
    return this.id
  }
}

export class ModuleName extends NodeName {
  static local = new ModuleName({ scope: LOCAL, segments: [] })

  static fromUrl(value) {
    return new ModuleName(ModuleName.parseUrl(value))
  }

  static parseUrl(value) {
    // e.g. node://nodejs.org/myScope/myModule/mySubModule
    // e.g. node://nodejs.org/global/myModule/mySubModule
    // e.g. node://nodejs.org/global/myModule
    const url = new URL(value)
    
    if (url.protocol !== SCHEME) {
      throw new Error(`Expected scheme "${SCHEME}", got "${url.protocol}".`)
    }
    
    if (url.host !== HOST) {
      throw new Error(`Expected host "${HOST}", got "${url.host}".`)
    }

    const scope = url.pathname.split('/')[1]
    const segments = url.pathname.split('/').slice(2)
    
    NodeName.assertAlphanumeric(scope, ...segments)
    return { scope, segments }
  }

  static fromImport(value) {
    return new ModuleName(ModuleName.parseImport(value))
  }
  
  static parseImport(value) {
    const parts = value.split('/')
    const isScoped = parts[0].startsWith('@')
    const scope = isScoped ? parts.shift().slice(1) : GLOBAL
    const segments = parts

    NodeName.assertAlphanumeric(scope, ...segments)
    return { scope, segments }
  }

  static scope(scope, ...names) {
    return new ModuleName({ scope, segments: names })
  }

  static name(...names) {
    return ModuleName.scope(GLOBAL, ...names)
  }

  constructor(parts) {
    const { scope = GLOBAL, segments = [] } = parts
    ModuleName.assertAlphanumeric(scope, ...segments)

    if (segments.length === 0 && scope !== LOCAL) {
      throw new Error("ModuleName must have at least one path segment.")
    }
    
    const path = segments.join('/') || null
    const tokens = [`${SCHEME}${HOST}`, scope, path].filter(Boolean)
    const id = tokens.join('/')
    super(id, parts, segments, path)

    this.scope = scope
  }

  get import() {
    if (this.isLocal)
      return null
    const tokens = []
    if (this.scope !== GLOBAL) {
      tokens.push(`@${this.scope}`)
    }
    tokens.push(this.path)
    return tokens.join('/')
  }

  get isScoped() {
    return !this.isGlobal && !this.isLocal
  }

  get isGlobal() {
    return this.scope === GLOBAL
  }

  get isLocal() {
    return this.scope === LOCAL
  }

  scope(scope) {
    return ModuleName.scope(scope).name(...this.parts.segments)
  }

  name(...names) {
    return new ModuleName({ scope: this.scope, segments: [...this.parts.segments, ...names] })
  }

  type(...names) {
    return new TypeName({ module: this.parts, segments: names })
  }
}

export class TypeName extends NodeName {

  static fromUrl(value) {
    return new TypeName(TypeName.parseUrl(value))
  }
  
  static parseUrl(value) {
    const url = new URL(value)
    const segments = url.hash ? url.hash.slice(1).split('.') : []
    
    NodeName.assertAlphanumeric(...segments)
    return { 
      module: ModuleName.parseUrl(url.origin + url.pathname.split('#')[0]), 
      segments 
    }
  }

  static fromFullName(value) {
    const parts = TypeName.parseFullName(value)
    return new TypeName(parts)
  }

  static parseFullName(value) {
    // e.g @myScope/myModule, MyType
    // e.g @myScope/myModule, myNs.MyType
    // e.g myModule, MyType
    // e.g myModule
    // e.g MyType
    // e.g myNs.MyType
    if (!value)
      return { }

    if (value.includes(',')) {
      return { 
        module: ModuleName.parseImport(typeParts[0]), 
        segments: TypeName.parseName(typeParts[1])
      }
    }

    if (value.includes('.')) { 
      return { segments: TypeName.parseName(value) } 
    }
    
    if (value.includes('/')) { 
      return { module: ModuleName.parseImport(value) } 
    }
    
    if (value[0] === value[0].toUpperCase()) { 
      return { segments: TypeName.parseName(value) } 
    }
    
    return { module: ModuleName.parseImport(value) }
  }

  static fromName(value) {
    return new TypeName(TypeName.parseName(value))
  }

  static parseName(value) {
    // e.g. MyType
    // e.g. myNs.MyType
    const segments = value.split('.')
    NodeName.assertAlphanumeric(...segments)
    return { segments }
  }

  static from(value) {
    return new TypeName(TypeName.parse(value))
  }

  static parse(value) {
    if (value.includes('#')) {
      return TypeName.parseUrl(value)
    }

    return TypeName.parseFullName(value)
  }
  
  constructor(parts) {
    const { module = ModuleName.local.parts, segments = [] } = parts
    if (!segments.length) {
      segments.push('default')
    }

    const moduleName = new ModuleName(module)
    const url = moduleName.url 
    const tokens = [url.toString()]
    const path = segments.join('.')
    tokens.push('#', path)

    const id = tokens.join('')
    super(id, parts, segments, path)

    this.moduleName = moduleName
    this.fullName = `${moduleName.import}, ${path}`
    this.namespace = !segments.length ? null : segments.slice(0, -1).join('.')
    this.name = segments[segments.length - 1]
  }

  get isRelative() {
    return !this.moduleName
  }

  get isDefault() {
    return this.path.length === 0
  }

  name(...names) {
    return new TypeName({ 
      module: this.moduleName, 
      segments: [...this.parts.segments, ...names] 
    })
  }

  toString() {
    return this.fullName
  }
}

// const scopedModuleName = ModuleName.scope('myScope', 'mySub0', 'mySub1', 'myModule')
// scopedModuleName.type('myNs0', 'myNs1', 'MyType').__dump()

// const moduleName = ModuleName.local
// moduleName.type('myNs', 'myType').__dump()

// const globalModuleName = ModuleName.name('mySub0', 'mySub1', 'myModule')
// globalModuleName.type('myNs0', 'myNs1', 'MyType').__dump()
