import { access, constants, stat } from 'fs/promises'
import { join, basename, dirname, extname } from 'path'
import { normalize, sep, isAbsolute } from 'path'
import { Refinery } from '@kingjs/refinery'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

class TempPath {
  static create({ extension = '', prefix = 'tmp-', suffix = '' } = {}) {
    const base = tmpdir()
    const name = `${prefix}${randomUUID()}${suffix}${extension}`
    return new Path()(base)(name)
  }

  static async createFile(options) {
    const path =this.create(options)
    await path.touch()
    return path
  }

  static async createDir(options) {
    const path = this.create(options)
    await path.make({ recursive: true })
    return path
  }
} 

export class Path extends Refinery {
  static root = new Path('/')
  static current = new Path('.')
  static parent = new Path('..')

  static create(pathOrStringOrUrl) {
    if (pathOrStringOrUrl instanceof Path)
      return pathOrStringOrUrl
    if (typeof pathOrStringOrUrl == 'string')
      return new Path(pathOrStringOrUrl)
    if (pathOrStringOrUrl instanceof URL)
      return new Path(pathOrStringOrUrl.pathname)
    throw new Error('Invalid Path.create argument. Must be a Path, string, or URL.')
  }
  static createRelative() {
    return Path.current(...arguments)
  }
  static createAbsolute() {
    return Path.root(...arguments)
  }

  // ========== Temp Path ==========

  static createTemp(options) {
    return TempPath.create(options)
  }
  static async createTempFile(options) {
    return await TempPath.createFile(options)
  }
  static async createTempDir(options) {
    return await TempPath.createDir(options)
  }

  #path

  constructor(basePath = '.') {
    super()
    this.#path = normalize(basePath)
  }

  refine$() {
    if (arguments.length == 0)
      return this.#path

    return new Path(join(this.#path, ...arguments))
  }

  // ========== Path predicates ==========

  get isAbsolute() {
    return isAbsolute(this.#path)
  }

  get isRelative() {
    return !this.isAbsolute
  }

  // ========== Path parse ==========

  get name() {
    return basename(this.value)
  }

  get basename() {
    return basename(this.#path, this.extension)
  }

  get extension() {
    return extname(this.#path)
  }

  get parent() {
    return new Path(dirname(this.#path))
  }

  get segments() {
    return this.#path.split(sep).filter(Boolean)
  }

  get value() {
    return this.#path
  }

  toString() {
    return this.value
  }

  // ========== Path access ==========

  get isReadable() {
    return access(this.#path, constants.R_OK).then(() => true).catch(() => false)
  }

  get isWritable() {
    return access(this.#path, constants.W_OK).then(() => true).catch(() => false)
  }

  get isExecutable() {
    return access(this.#path, constants.X_OK).then(() => true).catch(() => false)
  }

  // ========== Path type ==========
  
  get stats() {
    return stat(this.#path).catch(() => null)
  }

  get isFile() {
    return this.stats.then(s => s?.isFile() ?? false)
  }

  get isDirectory() {
    return this.stats.then(s => s?.isDirectory() ?? false)
  }

  get isLink() {
    return this.stats.then(s => s?.isSymbolicLink() ?? false)
  }

  // ========== Path dates ==========

  get modifiedDate() {
    return this.stats.then(s => s?.mtime ?? null)
  }
  
  get creationDate() {
    return this.stats.then(s => s?.birthtime ?? null)
  }
  
  get changeDate() {
    return this.stats.then(s => s?.ctime ?? null)
  }
  
  get accessDate() {
    return this.stats.then(s => s?.atime ?? null)
  }

  // ========== Path times ==========

  get modifiedTime() {
    return this.modifiedDate.then(d => d?.getTime() ?? null)
  }

  get creationTime() {
    return this.creationDate.then(d => d?.getTime() ?? null)
  }

  get changeTime() {
    return this.changeDate.then(d => d?.getTime() ?? null)
  }

  get accessTime() {
    return this.accessDate.then(d => d?.getTime() ?? null)
  }

  // ========== Path stats ==========

  get isEmpty() {
    return this.stats.then(s => s ? s.size === 0 : true)
  }

  get size() {
    return this.stats.then(s => s?.size ?? null)
  }

  get ownerUserId() {
    return this.stats.then(s => s?.uid ?? null)
  }

  get ownerGroupId() {
    return this.stats.then(s => s?.gid ?? null)
  }

  // ========== Copying and moving ==========

  async copyTo(target, { recursive = false } = {}) {
    const target$ = Path.create(target)
    const { cp } = await import('fs/promises')
    await cp(this.#path, target$(), { recursive })
    return this
  }

  async moveTo(target) {
    const target$ = Path.create(target)
    const { rename } = await import('fs/promises')
    await rename(this.#path, target$())
    return this
  }

  // ========== File content utilities ==========

  async read() {
    const { readFile } = await import('fs/promises')
    return readFile(this.#path, 'utf8')
  }

  async write(data) {
    const { writeFile } = await import('fs/promises')
    await writeFile(this.#path, data, { flush: true })
    return this
  }

  async append(data) {
    const { appendFile } = await import('fs/promises')
    await appendFile(this.#path, data, { flush: true })
    return this
  }

  async touch(name) {
    const path = name ? this(name) : this
    const { open } = await import('fs/promises')
    const fh = await open(path(), 'a')
    await fh.close()
    return path
  }

  async unlink() {
    const { unlink } = await import('fs/promises')
    await unlink(this.#path)
    return this
  }

  // ========== Directory utilities ==========

  async make() {
    const { mkdir } = await import('fs/promises')
    await mkdir(this.#path, { recursive: true })
    return this
  }

  async list(projector) {
    const { readdir } = await import('fs/promises')
    const entries = await readdir(this.#path)
    const listing = entries.map(name => this(name))
    return projector ? listing.map(projector) : listing
  }

  // ========== Path existance ==========

  async exists() {
    try {
      await access(this.#path)
      return true
    } catch {
      return false
    }
  }

  // ========== Path removal ==========

  async remove() {
    const { rm } = await import('fs/promises')
    await rm(this.#path, { recursive: true, force: true })
    return this
  }

  async dispose() {
    await this.remove()
    return this
  }
  
  // ========== JSON utilities ==========

  async readJson() {
    const raw = await this.read()
    return JSON.parse(raw)
  }

  async writeJson(obj) {
    const json = JSON.stringify(obj, null, 2)
    await this.write(json)
    return this
  }
}
