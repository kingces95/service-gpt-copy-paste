import { parse } from 'path'
import { ModuleName } from '@kingjs/node-name'
import { LoadAsync } from '@kingjs/load'
async function __import() {
  const { nodeMetadataToPojo } = await import('@kingjs/node-metadata-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: nodeMetadataToPojo, dumpPojo }
}

class NodeLoader {
  async __dump() { 
    const { toPojo, dumpPojo } = await __import()
    const pojo = await toPojo(this)
    await dumpPojo(pojo)
  }

  // async fromPackageJson(packageJsonName) {
  //   if (typeof packageJsonName == 'string')
  //     packageJsonName = ModuleName.fromImport(packageJsonName)

  //   const packageJson = await packageJsonName.importJson()
  //   const packageName = ModuleName.fromImport(packageJson.name)
  //   const result = this.getPackage(packageName.name, {
  //     scope: packageName.scope,
  //     version: packageJson.version,
  //     description: packageJson.description,
  //     author: packageJson.author,
  //     homepage: packageJson.homepage,
  //     license: packageJson.license,
  //     repository: packageJson.repository,
  //   })

  //   const exports = packageJson.exports ?? { } 
  //   for (const [exportPath, _] of Object.entries(exports)) {
  //     // e.g. '.' -> { keyParts: [], type: 'json' }
  //     // e.g. './foo' -> { keyParts: ['foo'], type: 'json' }
  //     // e.g. './foo/bar' -> { keyParts: ['foo', 'bar'], type: 'json' }
  //     // e.g. './foo/bar.js' -> { keyParts: ['foo', 'bar'], type: 'code' }
  //     const parsed = parse(exportPath)
  //     const keyParts = [
  //       ...parsed.dir.split('/'), 
  //       parsed.base
  //     ].filter(Boolean).slice(1)

  //     result.addExport(...keyParts)
  //   }

  //   return result
  // }

  constructor() {
    this.#metadata = new Map()
  }

  #metadata

  #createMetadata(nodeName) {
    if (nodeName.isExportName)
      return new NodeExportMetadata(scope, nodeName)

    if (nodeName.isNamespace)
      return new NodeNamespaceMetadata(scope, nodeName)  

    if (nodeName.isTypeName)
      return new NodeTypeMetadata(scope, nodeName)

    throw new Error(`Unhandled node name: ${nodeName}`)
  }

  getMetadata(nodeName) {
    const key = nodeName.qualifiedName
    if (!this.#metadata.has(key))
      this.#metadata.set(key, this.#createMetadata(nodeName))
    return this.#metadata.get(key)
  }

  getPackage(name, scope) {
    const packageName = scope 
      ? ModuleName.fromScope(scope, name)
      : ModuleName.fromName(name)

    return this.getMetadata(packageName)
  }

  get metadata() { return [...this.#metadata.values()] }
  get packages() { return metadata.filter(o => o instanceof NodeExportMetadata) }
  get exports() { return metadata.filter(o => o instanceof NodeExportMetadata) }
  get types() { return metadata.filter(o => o instanceof NodeTypeMetadata) }
  get namespaces() { return metadata.filter(o => o instanceof NodeNamespaceMetadata) }
}

class NodeMetadata {
  async __dump() { 
    const { toPojo, dumpPojo } = await __import()
    const pojo = await toPojo(this)
    await dumpPojo(pojo)
  }

  constructor(loader, nodeName) {
    this.loader = loader
    this.nodeName = nodeName
  }

  get scope() {
    const parent = this.nodeName.parent

    if (!parent)
      return null

    return this.getMetadata(parent)
  }

  // node name predicates
  get isGlobal() { return this.nodeName.isGlobal }
  get isScoped() { return this.nodeName.isScoped }
  get isNamespace() { return this.nodeName.isNamespace }
  get isModuleName() { return this.nodeName.isModuleName }
  get isTypeName() { return this.nodeName.isTypeName }

  // node name parts
  get scope() { return this.nodeName.scope }
  get packageName() { return this.nodeName.packageName }
  get namespace() { return this.nodeName.namespace }
  get nesting() { return this.nodeName.nesting }
  get name() { return this.nodeName.name }

  // node name ids  
  get url() { return this.nodeName.url }
  get fullName() { return this.nodeName.fullName }
  get qualifiedName() { return this.nodeName.qualifiedName }
  get importString() { return this.nodeName.importString }
  
  toString() { return this.nodeName.toString() }
}

class NodeTypeMetadata extends NodeMetadata {
  constructor(loader, nodeName) {
    super(loader, nodeName)

    this.#value = new LoadAsync(async () => this.nodeName.import())
  }

  #value

  async load() { return this.#value.load() }

  getNestedType(name) {
    return this.loader.getMetadata(this.nodeName.addNesting(name))
  }
}

class NodeNamespaceMetadata extends NodeMetadata {
  constructor(loader, nodeName) {
    super(loader, nodeName)
  }

  getType(type) {
    return this.loader.getMetadata(this.nodeName.addType(type))
  }

  getNamespace(namespace) {
    return this.loader.getMetadata(this.nodeName.addNamespace(namespace))
  }
}

class NodeExportMetadata extends NodeNamespaceMetadata {
  constructor(loader, nodeName) {
    super(loader, nodeName)

    this.defaultType = new NodeTypeMetadata(loader, nodeName)
  }

  getExport(export$) {
    return this.loader.getMetadata(this.nodeName.addExport(export$))
  }
}

export {
  NodeLoader,
  NodeMetadata,
  NodeTypeMetadata,
  NodeExportMetadata,
}

const loader = new NodeLoader()
loader.fromPackageJson('@kingjs/node-metadata/package.json')
  .then(o => loader.__dump())