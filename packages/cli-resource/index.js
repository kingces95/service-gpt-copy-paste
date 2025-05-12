import assert from 'assert'
import { DisposableResource } from '@kingjs/disposable-resource'
import { DEV_NULL } from '@kingjs/cli-readable'
import { createReadStream } from 'fs'
import { createWriteStream } from 'fs'
import { CliReadable } from '@kingjs/cli-readable'
import { CliWritable } from '@kingjs/cli-writable'
import { Readable } from 'stream'
import { Lazy } from '@kingjs/lazy'

export class CliResource extends DisposableResource {
  #__from
  #__to

  constructor(resource, dispose, { __from, __to, ...options } = {}) {
    super(resource, dispose, options)
    this.#__from = __from
    this.#__to = __to
  }
  get stream() { return this.value }
  get fd() { return this.hasFd ? this.stream.fd : null }
  get hasFd() { return this.stream.fd != null }
  get isInput() { return false }
  get isOutput() { return false }
  get parent() { return null }

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

export class CliDestroyableResource extends CliResource {
  constructor(resource, options) {
    super(resource, async destroyable => 
      new Promise(resolve => destroyable.destroy(null, resolve)), options)
  }
}

export class CliEndableResource extends CliResource {
  constructor(resource, options) {
    super(resource, async endable => 
      new Promise(resolve => endable.end(resolve)), options)
  }
}

export class CliReadableResource extends CliDestroyableResource {
  #options

  constructor(stream, options) {
    super(stream, { ...options, 
      disposedEvent: stream.emitClose ? 'close' : 'end' })
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

export class CliWritableResource extends CliEndableResource {
  #options

  constructor(stream, options) {
    super(stream, { ...options, 
      disposedEvent: stream.emitClose ? 'close' : 'end' })
  }

  get options() { return this.#options }
  get isOutput() { return true }

  connect(pipe) {
    assert(this.stream instanceof Readable, 'stream must be a Readable')
    assert(pipe instanceof Readable, 'pipe must be a Readable')
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
  #parent
  constructor(stream, parent) {
    super(stream)
    this.#parent = parent
  }
  get parent() { return this.#parent }
}

export class CliCopiedWritableResource extends CliBorrowedWritableResource {
  #parent
  constructor(stream, parent) {
    super(stream)
    this.#parent = parent
  }
  get parent() { return this.#parent }
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

export class CliHereStringResource extends CliReadableResource {
  #buffer
  constructor(bufferOrString) {
    const buffer = Buffer.isBuffer(bufferOrString) 
      ? bufferOrString 
      : Buffer.from(bufferOrString)
    super(Readable.from(buffer))
    this.#buffer = buffer
  }
  get buffer() { return this.#buffer }
}

export class CliIterableSubstitutionResource extends CliReadableResource {
  constructor(iterable) {
    super(Readable.from(iterable))
  }
}

export class CliHereDocResource extends CliReadableResource {
  static *lines(arrayOfStrings) {
    for (const line of arrayOfStrings) {
      yield line
      yield '\n'
    }
  }

  #__lines
  constructor(arrayOfStrings) {
    super(Readable.from(CliHereDocResource.lines(arrayOfStrings)))
    this.#__lines = arrayOfStrings
  }
  get __lines() { return this.#__lines }
}

export class CliOsReadableResource extends CliReadableResource {
  #path
  #options

  constructor(path, osOptions = {}, options) {
    super(createReadStream(path, { ...osOptions, emitClose: true }), options)
    this.#path = path
    this.#options = osOptions
  }

  get path() { return this.#path }
  get options() { return this.#options }
}

export class CliOsWritableResource extends CliWritableResource {
  #path
  #options

  constructor(path, osOptions = {}, options) {
    super(createWriteStream(path, { ...osOptions, emitClose: true }), options)
    this.#path = path
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
    super(CliReadable.fromPath(DEV_NULL))
  }
}

export class CliNullWritableResource extends CliWritableResource {
  constructor() {
    super(CliWritable.fromPath(DEV_NULL))
  }
} 

// --- Test case ---
import { open } from 'fs/promises'

async function testWritableResourceReuse() {
  const fh = await open('test-output.txt', 'w+')

  // Sanity check: write using native createWriteStream
  const sanityStream = createWriteStream(null, { fd: fh.fd, autoClose: false })
  sanityStream.write('sanity\n')
  await new Promise(resolve => sanityStream.end(resolve))
  
  // First use
  const writer1 = new CliFdWritableResource(fh.fd)
  const stream1 = await writer1
  stream1.write('first\n')
  const stream11 = await writer1
  stream11.write(stream1 == stream11 ? 'yes\n' : 'no\n')
  await writer1.dispose()

  // Second use with same fd
  const writer2 = new CliFdWritableResource(fh.fd)
  const stream2 = await writer2
  stream2.write('second\n')
  await writer2.dispose()

  // Close the shared fd
  await fh.close()

  console.log('Test complete: fd was reused between writable streams')
}

// testWritableResourceReuse()