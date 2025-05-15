import { describe, it, expect, beforeEach } from 'vitest'
import { PassThrough } from 'stream'
import { CliShell } from '@kingjs/cli-shell'
import { Readable, PassThrough } from 'stream'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { unlink } from 'fs/promises'
import { compareStreams } from '@kingjs/cli-test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const HELLO_WORLD = 'hello world'
const HELLO = 'hello'
const WORLD = 'world'

describe('Redirect (errors)', () => {
  let $

  beforeEach(() => { $ = new CliShell() })

  it('stdbad', async () => {
    expect(() => {
      $(async $ => {
        return
      })({ stdbad: null })
    }).toThrow('Invalid redirect target: stdbad')
  })
})

describe('Redirect', () => {
  let $

  beforeEach(() => { $ = new CliShell() })

  it('null', async () => {
    await $(async $ => {
      return
    })({ stdin: null })
  })

  it('readable', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD)
    passThrough.end()
    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })({ stdin: passThrough })
  })

  it('writable', async () => {
    const passThrough = new PassThrough()
    await $(async $ => {
      $.stdout.write(HELLO_WORLD)
    })({ stdout: passThrough })
    expect(passThrough.readableEnded).toBe(false)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })

  it('path', async () => {
    const resultPath = `${__dirname}/out.txt`

    await $(async $ => {
      $.stdout.write(HELLO_WORLD)
    })({ stdout: resultPath })

    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })({ stdin: resultPath })
    unlink(resultPath)
  })

  it('number', async () => {
    const passThrough = new PassThrough()
    await $(async $ => {
      $.stdout.write(HELLO_WORLD)
    })({ stderr: passThrough, stdout: 2 })
    expect(passThrough.readableEnded).toBe(false)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })
})

describe('Stdout Redirect Coercion', () => {
  // Test redirects that have a known javascript form. For example,
  // $(...)({ stdin: 'hello world' }) coerces the string to an in
  // memory stream.
  let $

  beforeEach(() => { $ = new CliShell() })

  it('empty-string', async () => {
    await $(async $ => {
      $.stdout.write(HELLO_WORLD)
    })({ stdout: '' })
  })
})

describe('Stdin Redirect Coercion', () => {
  // Test redirects that have a known javascript form. For example,
  // $(...)({ stdin: 'hello world' }) coerces the string to an in
  // memory stream.
  let $

  beforeEach(() => { $ = new CliShell() })

  it('buffer', async () => {
    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })({ stdin: Buffer.from(HELLO_WORLD) })
  })
 
  it('empty-string', async () => {
    await $(async $ => {
      expect($.stdin.readableEnded).toBe(false)
    })({ stdin: '' })
  })

  it('array', async () => {
    await $(async $ => {
      await compareStreams($.stdin, `${HELLO}\n${WORLD}\n`)
    })({ stdin: [HELLO, WORLD] })
  })
  
  it('generator', async () => {
    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })({ stdin: function* () {
      for (const chunk of [HELLO, ' ', WORLD]) yield chunk
    }() })
  })
  
  it('async-generator', async () => {
    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })({ stdin: async function* () {
      for (const chunk of [HELLO, ' ', WORLD]) yield chunk
    }() })
  })
})

describe('Redirect Overloads', () => {
  // Test redirects that coerced to the form { [stream]: value }. For example:
  // $(...)('hello world') is equivalent to $(...)({ stdin: 'hello world' })
  let $

  beforeEach(() => { $ = new CliShell() })

  // e.g. like reading fd 3; e.g. $ (...) 0<&3
  it('input', async () => {
    const readable = Readable.from(HELLO_WORLD, { objectMode: false })
    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })(readable)
  })

  // e.g. like writing fd 3; e.g. $ (...) 1>&3
  it('output', async () => {
    const passThrough = new PassThrough()
    await $(async $ => {
      passThrough.write(HELLO_WORLD)
    })(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })

  // e.g. like here-string; e.g. $ (...) <<< "hello world"
  it('here-buffer', async () => {
    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })(Buffer.from(HELLO_WORLD))
  })

  // e.g. like here-string; e.g. $ (...) <<< "hello world"
  it('here-string', async () => {
    await $(async $ => {
      const line = await $.read()
      expect(line).toEqual(HELLO_WORLD)
    })(HELLO_WORLD)
  })

  // e.g. like here-doc; e.g. $ (...) <<EOF 'hello world' EOF
  it('here-doc', async () => {
    await $(async $ => {
      await compareStreams($.stdin, `${HELLO}\n${WORLD}\n`)
    })([HELLO, WORLD])
  })
  
  // e.g. like process-substitution; e.g. $ (...) <(echo "hello world")
  it('process-substitution', async () => {
    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })(function* () {
      for (const chunk of [HELLO, ' ', WORLD]) yield chunk
    }())
  })
  
  // e.g. like process-substitution; e.g. $ (...) <(echo "hello world")
  it('process-substitution-async', async () => {
    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })(async function* () {
      for (const chunk of [HELLO, ' ', WORLD]) yield chunk
    }())
  })
})
