import { URL } from 'url'
import { IdentifierStyle } from '@kingjs/identifier-style'

async function __import() {
  const { nodeNameToPojo } = await import('@kingjs/node-name-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: nodeNameToPojo, dumpPojo }
}

export const SCHEME = 'nodejs:'
export const HOST = 'nodejs.org'
export const GLOBAL = 'global'
export const LOCAL = 'local'
export const DEFAULT = 'default'

const JSON_IMPORT_OPTIONS = { with: { type: 'json' } }

function assert(value, message) { 
  if (!value) throw new Error(message || 'Assertion failed.') 
}
function isPackageName(value) { return value && /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/.test(value) }
function isScopeName(value) { return value && /^[a-z0-9]+$/.test(value) }
function isExportName(value) { return value && /^[a-zA-Z0-9-_]+$/.test(value) }
function isObjectName(value) { return value && /^[a-zA-Z0-9]+$/.test(value) }
function assertIsPackageName(value) { assert(isPackageName(value), `Expected package name, got "${value}".`) }
function assertIsScopeName(value) { assert(isScopeName(value), `Expected scope name, got "${value}".`) }
function assertIsObjectName(value) { assert(isObjectName(value), `Expected object name, got "${value}".`) }
function assertAreExportNames(...values) { 
  if (values.some(v => !isExportName(v))) {
    throw new Error(`Expected export name, got "${values.join(', ')}".`)
  }
}
function assertAreObjectNames(...values) {
  if (values.some(v => !isObjectName(v))) {
    throw new Error(`Expected node name, got "${values.join(', ')}".`)
  }
}

export class NodeName {
  async __dump() { 
    const { dumpPojo } = await __import()
    await dumpPojo(await this.toPojo()) 
  }

  static async loadClass(value) {
    const type = typeof value
    switch (type) {
      case 'function':
        return value
      case 'string':
        const class$ = await NodeName.from(value).importObject()
        if (!class$) 
          throw new Error(`Could not load class ${value}`)
        if (!typeof class$ == 'function') 
          throw new Error(`Class ${value} must be a function`)
        return class$
    }
    throw new Error(`Could not load class`)
  }

  static async import(value) {
    const nodeName = NodeName.from(value)
    return await nodeName.importObject()
  }
  
  static fromScope(scope, packageName, ...exports) {
    return new NodeName({ scope, packageName, exports })
  }

  static fromName(name, ...exports) {
    return NodeName.fromScope(GLOBAL, name, ...exports)
  }

  static from(value) {
    const parts = NodeName.parse(value)
    return new NodeName(parts)
  }

  static parse(value) {
    // e.g. node://nodejs.org/my-module#myNs.MyType
    if (value.includes(SCHEME)) {
      return NodeName.parseUrl(value)
    }

    // e.g @myscope/my-module, MyType
    // e.g @myscope/my-module, myNs.MyType
    // e.g my-module, MyType
    if (value.includes(',')) {
      const [moduleName, objectName] = value.split(/,\s*/) 
      const typeNameParts = NodeName.parseObjectName(objectName)
      const moduleNameParts = NodeName.parseModuleName(moduleName)
      return { ...moduleNameParts, ...typeNameParts }
    }
    
    // e.g @myscope/my-module
    return { ...NodeName.parseModuleName(value) }
  }

  static parseUrl(value) {
    const [ moduleImport, hash ] = value.split('#')

    // e.g. node://nodejs.org/myscope/my-module/myExport/mySubExport
    // e.g. node://nodejs.org/global/my-module/myExport
    // e.g. node://nodejs.org/global/my-module
    const url = new URL(moduleImport)
    
    if (url.protocol !== SCHEME) {
      throw new Error(`Expected scheme "${SCHEME}", got "${url.protocol}".`)
    }
    
    if (url.host !== HOST) {
      throw new Error(`Expected host "${HOST}", got "${url.host}".`)
    }

    // e.g. myscope
    const scope = url.pathname.split('/')[1]

    // e.g. my-module
    const packageName = url.pathname.split('/')[2]
    
    // e.g. myExport, mySubExport
    const exports = url.pathname.split('/').slice(3) 
    
    assertIsScopeName(scope)
    assertIsPackageName(packageName)
    assertAreExportNames(...exports)
    const moduleNameParts = { scope, packageName, exports }
    const typeNameParts = hash ? NodeName.parseObjectName(hash) : { }
    
    return { ...moduleNameParts, ...typeNameParts }
  }

  static parseObjectName(value) {
    // e.g. myNs.MyType
    // e.g. myNs.mySubNs.MyType
    // e.g. MyType
    const dotSplit = value.split('.')
    const namespaces = dotSplit.slice(0, -1)
    const objectName = dotSplit.pop()

    assertAreObjectNames(...namespaces)
    if (objectName)
      assertIsObjectName(objectName)
    return { namespaces, objectName }
  }
  
  static parseModuleName(value) {
    // e.g. @myscope/my-module
    // e.g. @myscope/my-module/myExport
    // e.g. my-module
    // e.g. my-module/myExport
    // e.g. my-module/myExport/mySubExport

    const parts = value.split('/')
    const isScoped = parts[0].startsWith('@')
    // e.g. myscope
    const scope = isScoped ? parts.shift().slice(1) : GLOBAL
    // e.g. my-module
    const packageName = parts.shift()
    // e.g. myExport, mySubExport
    const exports = parts

    assertIsScopeName(scope)
    assertIsPackageName(packageName)
    assertAreExportNames(...exports)
    return { scope, packageName, exports }
  }

  #scope
  #packageName
  #exports
  #namespaces
  #objectName

  constructor(parts) {

    // module parts
    const { scope = GLOBAL, packageName, exports = [] } = parts
    assertIsScopeName(scope)
    assertIsPackageName(packageName)
    assertAreExportNames(...exports)
    this.#scope = scope // e.g. myscope
    this.#packageName = packageName // e.g. my-module
    this.#exports = exports.length ? exports : undefined // e.g. myExport, mySubExport

    // full name parts
    const { namespaces = [], objectName } = parts
    assertAreObjectNames(...namespaces)
    if (objectName)
      assertIsObjectName(objectName)
    this.#namespaces = namespaces.length ? namespaces : undefined
    this.#objectName = objectName
  }

  get #isGlobal() { return this.#scope === GLOBAL }
  get #isScoped() { return !!this.#scope && !this.#isGlobal }

  get #parts() {
    return { 
      scope: this.#scope, 
      packageName: this.#packageName, 
      exports: this.#exports,
      namespaces: this.#namespaces, 
      objectName: this.#objectName 
    }
  }

  get #fullName() {
    return [
      this.#namespaces?.join('.') || null,
      this.#objectName
    ].filter(Boolean).join('.') || null
  }

  get type() {
    if (this.isModuleName) return 'export'
    if (this.isObjectName) return 'type'
    throw new Error('Unknown type.')
  }
  get isModuleName() { return !this.#objectName }
  get isObjectName() { return isObjectName(this.#objectName) }

  get name() { 
    return this.#objectName ? this.#objectName
      : this.#exports ? this.#exports[this.#exports.length - 1]
      : this.#packageName
  }
  get defaultName() {
    if (!this.isModuleName) return null
    return IdentifierStyle.from(this.name).toPascal()
  }
  get parentUrl() { return this.parent?.url }
  get parent() {
    if (this.#namespaces) {
      const namespaces = [...this.#namespaces]
      const objectName = namespaces.pop()
      return new NodeName({
        ...this.moduleName.#parts,
        namespaces: namespaces.length ? namespaces : undefined,
        objectName,
      })
    }

    if (this.#objectName) {
      return new NodeName({
        ...this.moduleName.#parts
      })
    }

    if (this.#exports) {
      const exports = [...this.#exports]
      exports.pop()
      return new NodeName({
        ...this.moduleName.#parts,
        exports: exports.length ? exports : undefined,
      })
    }

    return null
  }

  get packageName() { 
    if (this.isModuleName && !this.#exports)
      return this

    return new NodeName({ 
      scope: this.#scope, 
      packageName: this.#packageName,
    })
  }

  get moduleName() { 
    if (this.isModuleName)
      return this

    return new NodeName({ 
      scope: this.#scope, 
      packageName: this.#packageName, 
      exports: this.#exports,
    })
  }

  addExport(...exports) {
    if (!this.isModuleName)
      throw new Error('Cannot add export.')

    return new NodeName({ 
      ...this.#parts, 
      exports: [...(this.#exports || []), ...exports] 
    })
  }

  addName(...names) {
    const namespaces = []
    if (this.#namespaces) namespaces.push(...this.#namespaces)
    if (this.#objectName) namespaces.push(this.#objectName)
    namespaces.push(...names)
    const objectName = namespaces.pop()
    return new NodeName({ 
      ...this.moduleName.#parts, 
      namespaces: namespaces.length ? namespaces : undefined,
      objectName
    })
  }

  get url() {
    // e.g. node://nodejs.org/myscope/my-module/myExport/mySubExport
    // e.g. node://nodejs.org/global/my-module/myExport
    // e.g. node://nodejs.org/global/my-module
    // e.g. node://nodejs.org/global/my-module#myNs.MyType
    // e.g. node://nodejs.org/global/my-module#myNs.MyType+MyNestedType
    // e.g. node://nodejs.org/global/my-module#myNs.MyType+MyNestedType+MyNested
    return new URL([
      [
        `${SCHEME}//${HOST}`, 
        this.#scope, 
        this.#packageName, 
        ...(this.#exports || [])
      ].filter(Boolean).join('/'), 
      this.#fullName
    ].filter(Boolean).join('#'))  
  }

  async import() { 
    if (!this.isModuleName)
      throw new Error('Cannot import a non-export name.')
    const importString = this.toString()
    return import(importString) 
  }

  async importJson() { 
    if (!this.isModuleName)
      throw new Error('Cannot import a non-export name.')
    const module = await import(this.toString(), JSON_IMPORT_OPTIONS)
    return module?.default 
  }

  async importObject() {
    const module = this.isModuleName 
      ? await this.import() 
      : await this.parent.import()

    if (this.isModuleName)
      return module.default ?? module[this.defaultName] 

    return module[this.name]
  }

  async toPojo() {
    const { toPojo } = await __import()
    return await toPojo(this)
  }

  toString() {
    // e.g. myExport/mySubExport
    const exportPath = [
      this.#packageName, 
      ...(this.#exports || [])
    ].filter(Boolean).join('/')

    // e.g. @myscope/my-module/myExport/mySubExport
    const moduleName = this.#isScoped 
      ? `@${this.#scope}/${exportPath}` 
      : exportPath

    return [
      moduleName, 
      this.#fullName
    ].filter(Boolean).join(', ')
  }
}

// async function test() {
//   const ids = [
//     'nodejs://nodejs.org/myscope/my-module/myExport',
//     'nodejs://nodejs.org/myscope/my-module#myNs.mySubNs.MyType',
//     'nodejs://nodejs.org/myscope/my-module#myNs.MyType',
//     'nodejs://nodejs.org/myscope/my-module#MyType',
//     'nodejs://nodejs.org/myscope/my-module',
//     'nodejs://nodejs.org/global/my-module',
//     'nodejs://nodejs.org/global/my-module',
//     'nodejs://nodejs.org/global/my_module',
//     '@myscope/my-module, myNs.MyType',
//     '@myscope/my-module, MyType',
//     '@myscope/my-module',
//     'my-module, myNs.MyType',
//     'my-module, myNs.mySubNs',
//     'my-module, myNs',
//     'my-module, MyType',
//     'my-module',
//   ]
//   for (var id of ids) {
//     console.error(`-- ${id}`)
//     const typeName = await NodeName.from(id)
//     await typeName.__dump()
//   }
// }

// test()
