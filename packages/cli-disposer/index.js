import assert from 'assert'
import { Readable, Writable } from 'stream'
import { Resource } from '@kingjs/disposer'

export class CliStreamDisposer extends Resource {
  static fromReader(stream) {
    return new CliReadableDisposer(stream)
  }
  static fromWriter(stream) {
    return new CliWritableDisposer(stream)
  }
  // How a stream is disposed is a function of

  //    1. Creation flags: How a stream is created determins
  // how it is disposed. Since not all stream creation flags are
  // exposed for reflection, the cli cannot dispose streams it
  // did not create. The two flags that are relevant to disposal
  // are: (a) autoClose and (b) emitClose. The cli always creates
  // streams with these flags enabled. 

  //    2. Type: If the stream is a Readable, it is destroyed; 
  // if Writable, it is ended.

  // In general, the cli aims to synchronize disposal with the
  // file system resource being closed. Specifically for writable
  // streams, this means after disposal, any writes have been
  // flushed to disk and the file descriptor is closed.

  constructor(stream, disposeFn) {
    assert(stream.fd == null || stream.autoClose, 
      'stream with fd must autoClose')
    super(
      stream, disposeFn, { 
        event: 'close', 
        disposedFn: o => o.closed 
      },
    )
  }
}

export class CliReadableDisposer extends CliStreamDisposer {
  constructor(stream) {
    assert(stream instanceof Readable, 'stream must be a Readable')
    super(stream, reader => reader.destroy())
  }
}

export class CliWritableDisposer extends CliStreamDisposer {
  constructor(stream) {
    assert(stream instanceof Writable, 'stream must be a Writable')
    super(stream, writer => writer.end())
  }
}
