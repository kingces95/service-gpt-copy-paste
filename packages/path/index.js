import { access, constants, stat, lstat } from 'fs/promises'
import { join, basename, dirname, extname, resolve, relative } from 'path'
import { normalize, sep, isAbsolute } from 'path'
import { Refinery } from '@kingjs/refinery'
import { tmpdir, type } from 'os'
import { randomUUID } from 'crypto'
import { AsyncLocalStorage } from 'async_hooks'

const CLI_CONTEXT_SYMBOL = Symbol.for('@kingjs/cli-context')

if (process[CLI_CONTEXT_SYMBOL] == null) {
  const storage = new AsyncLocalStorage()
  process[CLI_CONTEXT_SYMBOL] = storage
}

class TempPath {
  static create({ extension = '', prefix = 'tmp-', suffix = '' } = {}) {
    const base = tmpdir()
    const name = `${prefix}${randomUUID()}${suffix}${extension}`
    return new Path()(base)(name)
  }

  static async createFile(options) {
    const path = this.create(options)
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
  static Readable = constants.R_OK
  static Writable = constants.W_OK
  static Executable = constants.X_OK
  static Exists = constants.F_OK

  static root = new Path('/')
  static current = new Path('.')
  static parent = new Path('..')

  static cwd() { 
    const context = process[CLI_CONTEXT_SYMBOL].getStore()
    return Path.create(context?.cwd ?? process.cwd())
  }
  static withCwd(cwd, callback) {
    cwd = Path.create(cwd)
    if (!cwd.isAbsolute) throw new Error('Path must be absolute.')
    return new Promise((resolve, reject) => {
      process[CLI_CONTEXT_SYMBOL].run({ cwd }, 
        () => Promise.resolve().then(callback).catch(reject).then(resolve)
      )
    })
  }
  static create(pathOrStringOrUrl) {
    if (pathOrStringOrUrl instanceof Path)
      return pathOrStringOrUrl

    return new Path(Path.toString(pathOrStringOrUrl))
  }
  static createRelative() {
    return Path.current(...arguments)
  }
  static createAbsolute() {
    return Path.root(...arguments)
  }

  static toString(pathOrStringOrUrl) {
    if (pathOrStringOrUrl instanceof Path)
      return pathOrStringOrUrl()

    if (pathOrStringOrUrl instanceof URL)
      return pathOrStringOrUrl.pathname

    if (typeof pathOrStringOrUrl == 'string')
      return pathOrStringOrUrl

    throw new Error('Path must be a Path, string, or URL.')
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

  constructor(path = '.') {
    super()
    this.#path = normalize(path)
  }

  refine$() {
    if (arguments.length == 0)
      return this.#path

    return [...arguments].reduce((base, arg) => {
      const segment = Path.create(arg)
      if (segment.isAbsolute)
        return segment
      return Path.create(join(base(), segment()))
    }, this)
  }

  // ========== IEquatable ==========

  equals(path) {
    if (!(path instanceof Path))
      return false

    return this() == path()
  }

  // ========== Path parse ==========

  get name() {
    return basename(this.value)
  }

  get basename() {
    return basename(this(), this.extension)
  }

  get extension() {
    return extname(this())
  }

  get parent() {
    return Path.create(dirname(this()))
  }

  get segments() {
    return this().split(sep).filter(Boolean)
  }

  get value() {
    return this()
  }

  relativeTo(basePath) {
    const basePath$ = Path.create(basePath)
    return Path.create(relative(basePath$(), this()))
  }

  toString() {
    return Path.toString(this)
  }

  // ========== Path predicates ==========

  get isAbsolute() {
    return isAbsolute(this())
  }

  get isRelative() {
    return !this.isAbsolute
  }

  resolve() {
    if (this.isAbsolute && arguments.length == 0) return this
    const segments = [...arguments].map($ => Path.create($))
    const cwd = Path.cwd()
    const result = resolve(cwd(), this(), ...segments.map($ => $()))
    return Path.create(result)
  }

  // ========== Path access ==========

  async access({ mode = Path.Exists } = { }) {
    // https://github.com/nodejs/node/issues/14025
    // mirror behavior of fs.existsSync
    // symlinks should be transparent

    const this$ = this.resolve()

    // base case
    if (!await this.isLink()) {
      return await access(this$(), mode).then(() => true).catch(() => false)
    }

    // recursive case
    const link = await this.parent(await this.readLink())
    return link.access({ mode })
  }
  exists() { return this.access({ mode: Path.Exists }) }
  isReadable() { return this.access({ mode: Path.Readable }) }
  isWritable() { return this.access({ mode: Path.Writable }) }
  isExecutable() { return this.access({ mode: Path.Executable }) }

  // ========== Path type ==========
  
  stats({ ofLink = false } = {}) {
    const this$  = this.resolve()
    return (ofLink ? lstat : stat)(this$()).catch(() => null)
  }

  isFile() {
    return this.stats().then(s => s?.isFile() ?? false)
  }

  isDirectory() {
    return this.stats().then(s => s?.isDirectory() ?? false)
  }

  isLink() {
    return this.stats({ ofLink: true })
      .then(s => s?.isSymbolicLink() ?? false)
  }

  // ========== Path identifiers ==========
  
  ino(options) {
    return this.stats(options).then(s => s?.ino ?? null)
  }

  dev(options) {
    return this.stats(options).then(s => s?.dev ?? null)
  }

  // ========== Path permissions ==========

  ownerUserId(options) {
    return this.stats(options).then(s => s?.uid ?? null)
  }

  ownerGroupId(options) {
    return this.stats(options).then(s => s?.gid ?? null)
  }

  // ========== Path stats ==========

  isEmpty(options) {
    return this.stats(options).then(s => s ? s.size === 0 : true)
  }

  size(options) {
    return this.stats(options).then(s => s?.size ?? null)
  }

  // ========== Path dates ==========

  modifiedDate(options) {
    return this.stats(options).then(s => s?.mtime ?? null)
  }
  
  creationDate(options) {
    return this.stats(options).then(s => s?.birthtime ?? null)
  }
  
  changeDate(options) {
    return this.stats(options).then(s => s?.ctime ?? null)
  }
  
  accessDate(options) {
    return this.stats(options).then(s => s?.atime ?? null)
  }

  // ========== Path times ==========

  modifiedTime(options) {
    return this.modifiedDate(options).then(d => d?.getTime() ?? null)
  }

  creationTime(options) {
    return this.creationDate(options).then(d => d?.getTime() ?? null)
  }

  changeTime(options) {
    return this.changeDate(options).then(d => d?.getTime() ?? null)
  }

  accessTime(options) {
    return this.accessDate(options).then(d => d?.getTime() ?? null)
  }

  // ========== Copying and moving ==========

  // cp options:
  // - recursive: copy directories recursively
  // - dereference: follow symlinks and copy targets instead
  // - filter: function (src, dest) => boolean to skip entries
  // - preserveTimestamps: keep atime/mtime from source
  // - errorOnExist: throw if destination exists
  // - force: overwrite existing files (ignored if errorOnExist is true)
  // - mode: file/dir permissions (only when creating)
  async copy(relPath, {
    preserveTimestamps = true,
    errorOnExist = false,
    force = false,
    dereference = false,
    mode = undefined,
  } = { }) {
    const path = this.parent(relPath)
    const this$ = this.resolve()
    const path$ = path.resolve()

    if (!dereference && await this$.isLink()) {
      // cp does not preserve the link value!
      const link = await this$.readLink()
      await path$.symlink(link)
      return path
    }

    const { cp } = await import('fs/promises')
    await cp(this$(), path$(), {
      recursive: false,
      dereference,
      preserveTimestamps,
      errorOnExist,
      force,
      mode,
    })

    return path
  }

  async rename(relPath) {
    const path = this.parent(relPath)
    const this$ = this.resolve()
    const path$ = path.resolve()
    const { rename } = await import('fs/promises')
    await rename(this$(), path$())
    return path
  }

  // ========== File content utilities ==========

  async read() {
    const { readFile } = await import('fs/promises')
    const this$ = this.resolve()
    return readFile(this$(), 'utf8')
  }

  async write(data) {
    const { writeFile } = await import('fs/promises')
    const this$ = this.resolve()
    await writeFile(this$(), data, { flush: true })
    return this
  }

  async append(data) {
    const { appendFile } = await import('fs/promises')
    const this$ = this.resolve()
    await appendFile(this$(), data, { flush: true })
    return this
  }

  async touch(name) {
    const { open } = await import('fs/promises')
    const path = name ? this(name) : this
    const path$ = path.resolve()
    const fh = await open(path$(), 'a')
    await fh.close()
    return path
  }

  async unlink() {
    const { unlink } = await import('fs/promises')
    const this$ = this.resolve()
    await unlink(this$())
    return this
  }

  // ========== JSON utilities ==========

  async parse() {
    const this$ = this.resolve()
    const raw = await this$.read()
    return JSON.parse(raw)
  }

  async stringify(obj) {
    const json = JSON.stringify(obj, null, 2)
    const this$ = this.resolve()
    await this$.write(json)
    return this
  }
  
  // ========== Directory utilities ==========

  async make() {
    const { mkdir } = await import('fs/promises')
    const this$ = this.resolve()
    await mkdir(this$(), { recursive: true })
    return this
  }

  async list(projector) {
    const { readdir } = await import('fs/promises')
    const this$ = this.resolve()
    const entries = await readdir(this$())
    const listing = entries.map(name => this(name))
    return projector ? listing.map(projector) : listing
  }

  // ========== Path removal ==========

  async remove() {
    const { rm } = await import('fs/promises')
    const this$ = this.resolve()
    await rm(this$(), { recursive: true, force: true })
    return this
  }

  async dispose() {
    return await this.remove()
  }
  
  // ========== Path resolution ==========

  async realPath() {
    const { realpath } = await import('fs/promises')
    const this$ = this.resolve()
    const result = await realpath(this$())
    return Path.create(result)
  }
  
  // ========== Symbolic links ==========

  async readLink() {
    const { readlink } = await import('fs/promises')
    const this$ = this.resolve()
    const result = await readlink(this$())
    return Path.create(result)
  }

  async symlink(value) {
    const { symlink } = await import('fs/promises')
    const value$ = Path.create(value)
    const this$ = this.resolve()
    await symlink(value$(), this$())
    return this
  }

  // ========== Hard links ==========

  async link(value) {
    const { link } = await import('fs/promises')
    const value$ = Path.create(value)
    const this$ = this.resolve()
    const result = await link(this$(), value$())
    return Path.create(result)
  }

  linkCount(options) {
    return this.stats(options).then(s => s?.nlink ?? null)
  }
}
