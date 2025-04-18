import { Duplex } from 'stream'

export class CliDuplex extends Duplex {
  #stdin
  #stdout

  constructor({ stdin, stdout }) {
    super()
    this.#stdin = stdin
    this.#stdout = stdout

    if (this.#stdout) {
      this.#stdout.on('data', chunk => {
        if (!this.push(chunk)) this.#stdout.pause()
      })
      this.on('drain', () => this.#stdout.resume())
      this.#stdout.on('end', () => this.push(null))
    }
  }

  _read(size) {
    // noop: data is pushed by stdout's 'data' event
  }

  _write(chunk, encoding, callback) {
    if (!this.#stdin) {
      process.nextTick(() => callback(new Error('No writable stream')))
      return
    }

    if (!this.#stdin.write(chunk, encoding)) {
      this.#stdin.once('drain', callback)
    } else {
      process.nextTick(callback)
    }
  }
}  
