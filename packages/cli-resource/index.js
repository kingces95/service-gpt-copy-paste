import assert from 'assert'
import { Resource } from '@kingjs/resource'
import { DEV_NULL } from '@kingjs/cli-readable'
import { createReadStream } from 'fs'
import { createWriteStream } from 'fs'
import { CliReadable } from '@kingjs/cli-readable'
import { CliWritable } from '@kingjs/cli-writable'
import { Readable, Writable } from 'stream'
import { Disposer } from '@kingjs/disposer'
import { Path } from '@kingjs/path'

export class CliResource extends Resource {
  #__from
  #__to

  constructor(resource, disposer, { __from, __to, ...options } = {}) {
    const resourceFn = resource instanceof Function 
      ? resource : () => resource
    super(resourceFn, disposer, options)
    this.#__from = __from
    this.#__to = __to
  }
  get stream() { return this.value }
  get fd() { return this.hasFd ? this.stream.fd : null }
  get hasFd() { return this.stream.fd != null }
  get isInput() { return false }
  get isOutput() { return false }
  get __resource() { return null }

  get __from() { return this.#__from }
  get __to() { return this.#__to }
  get __type() {
    // ctor name less 'Cli' prefix and 'Resource' suffix
    const ctor = this.constructor.name
      .replace('Cli', '')
      .replace('Resource', '')
      .replace('Readable', '')
      .replace('Writable', '')
    return ctor
  }
  get __flow() {
    if (this.isInput) return 'in'
    if (this.isOutput) return 'out'
    return 'unknown'
  }

  connect() { return }
  borrow() {
    if (!this.isOwned) return this
    return this.isInput
      ? new CliCopiedReadableResource(this.stream, this) 
      : new CliCopiedWritableResource(this.stream, this)
  }
}

export class CliReadableResource extends CliResource {
  static disposer = new Disposer(
    readable => new Promise(resolve => readable.destroy(null, resolve)), { 
    disposedFn: readable => readable.closed,
    event: 'close',
  })

  #options

  constructor(stream, options) {
    super(stream, new.target.disposer, options)
  }

  get options() { return this.#options }
  get isInput() { return true }

  connect(pipe) {
    assert(this.stream instanceof Readable, 'stream must be a Readable')
    assert(pipe instanceof Readable, 'pipe must be a Readable')
    if (pipe == this.stream) return
    this.stream.pipe(pipe)
  }
}

export class CliWritableResource extends CliResource {
  static disposer = new Disposer(
    writable => new Promise(resolve => writable.end(null, resolve)), { 
    disposedFn: writable => writable.closed,
    event: 'close',
  })

  #options

  constructor(stream, options) {
    super(stream, new.target.disposer, options)
  }

  get options() { return this.#options }
  get isOutput() { return true }

  connect(pipe) {
    assert(this.stream instanceof Writable, 'stream must be a Writable')
    assert(pipe instanceof Writable, 'pipe must be a Writable')
    if (pipe == this.stream) return
    pipe.pipe(this.stream, { end: this.isOwned })
  }
}

export class CliBorrowedReadableResource extends CliReadableResource {
  constructor(stream, options) {
    super(stream, { ...options, end: false })
  }
}

export class CliBorrowedWritableResource extends CliWritableResource {
  constructor(stream, options) {
    super(stream, { ...options, end: false })
  }
}

export class CliCopiedReadableResource extends CliBorrowedReadableResource {
  #__resource
  constructor(stream, __resource) {
    super(stream)
    this.#__resource = __resource
  }
  get __resource() { return this.#__resource }
}

export class CliCopiedWritableResource extends CliBorrowedWritableResource {
  #__resource
  constructor(stream, __resource) {
    super(stream)
    this.#__resource = __resource
  }
  get __resource() { return this.#__resource }
}

export class CliPipedWritableResource extends CliWritableResource {
  constructor(pipe, options) {
    super(pipe, options)
  }
  get hasFd() { return false }
}

export class CliPipedReadableResource extends CliReadableResource {
  constructor(pipe, options) {
    super(pipe, options)
  }
  get hasFd() { return false }
}

export class CliParentPipedWritableResource extends CliPipedWritableResource {
  constructor(pipe, options) {
    super(pipe, options)
  }
}

export class CliParentPipedReadableResource extends CliPipedReadableResource {
  constructor(pipe, options) {
    super(pipe, options)
  }
}

export class CliChildPipedWritableResource extends CliPipedWritableResource {
  constructor(pipe, options) {
    super(pipe, options)
  }
}

export class CliChildPipedReadableResource extends CliPipedReadableResource {
  constructor(pipe, options) {
    super(pipe, options)
  }
}

export class CliIterableSubstitutionResource extends CliReadableResource {
  constructor(iterable) {
    // disable objectMode so that the stream treats results as string chunks
    super(Readable.from(iterable, { objectMode: false }))
  }
}

export class CliHereStringResource extends CliIterableSubstitutionResource {
  #__bufferOrString
  constructor(bufferOrString) {
    super(bufferOrString)
    this.#__bufferOrString = bufferOrString
  }
  get __bufferOrString() { return this.#__bufferOrString }
}

export class CliHereDocResource extends CliIterableSubstitutionResource {
  static *lines(arrayOfStrings) {
    for (const line of arrayOfStrings) {
      yield line
      yield '\n'
    }
  }

  #__lines
  constructor(arrayOfStrings) {
    super(CliHereDocResource.lines(arrayOfStrings))
    this.#__lines = arrayOfStrings
  }
  get __lines() { return this.#__lines }
}

export class CliOsReadableResource extends CliReadableResource {
  #path
  #options

  constructor(path, osOptions = {}, options) {
    const path$ = Path.create(path)
    super(createReadStream(path$.$, { ...osOptions, emitClose: true }), options)
    this.#path = path$
    this.#options = osOptions
  }

  get path() { return this.#path }
  get options() { return this.#options }
}

export class CliOsWritableResource extends CliWritableResource {
  #path
  #options

  constructor(path, osOptions = {}, options) {
    const path$ = Path.create(path)
    super(createWriteStream(path$.$, { ...osOptions, emitClose: true }), options)
    this.#path = path$
    this.#options = osOptions
  }

  get path() { return this.#path }
  get options() { return this.#options }
}

export class CliFdReadableResource extends CliOsReadableResource {
  constructor(fd, osOptions, options) {
    super(null, { fd, ...osOptions }, options)
  }
}

export class CliFdWritableResource extends CliOsWritableResource {
  constructor(fd, osOptions, options) {
    super(null, { fd, ...osOptions }, options)
  }
}

export class CliBorrowedFdReadableResource extends CliFdReadableResource {
  constructor(fd, osOptions = {}, options) {
    super(fd, { ...osOptions, autoClose: false }, { end: false})
  }
}

export class CliBorrowedFdWritableResource extends CliFdWritableResource {
  constructor(fd, osOptions = {}, options) {
    super(fd, { ...osOptions, autoClose: false }, { end: false})
  }
}

export class CliFhReadableResource extends CliFdReadableResource {
  #fileHandle
  constructor(fileHandle, osOptions, options) {
    super(fileHandle.fd, osOptions, options)
    this.#fileHandle = fileHandle
  }
  get fileHandle() { return this.#fileHandle }
}

export class CliFhWritableResource extends CliFdWritableResource {
  #fileHandle
  constructor(fileHandle, osOptions, options) {
    super(fileHandle.fd, osOptions, options)
    this.#fileHandle = fileHandle
  }
  get fileHandle() { return this.#fileHandle }
}

export class CliBorrowedFhReadableResource extends CliFhReadableResource {
  constructor(fh, options = {}) {
    super(fh, { ...options, autoClose: false }, { end: false})
  }
}

export class CliBorrowedFhWritableResource extends CliFhWritableResource {
  constructor(fh, options = {}) {
    super(fh, { ...options, autoClose: false }, { end: false})
  }
}

export class CliPathReadableResource extends CliOsReadableResource {
  #__path
  constructor(path, osOptions, __path) {
    super(path, osOptions)
    this.#__path = __path
  }
  get __path() { return this.#__path }
}

export class CliPathWritableResource extends CliOsWritableResource {
  #__path
  constructor(path, osOptions, __path) {
    super(path, osOptions)
    this.#__path = __path
  }
  get __path() { return this.#__path }
} 

export class CliNullReadableResource extends CliReadableResource {
  constructor() {
    super(Readable.from([]))
  }
}

export class CliNullWritableResource extends CliWritableResource {
  static Sink = new Writable({
    write(chunk, encoding, callback) { callback() }
  })

  constructor() {
    super(new.target.Sink)
  }
} 
