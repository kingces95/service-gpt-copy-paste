import { describe, it, expect, beforeEach } from 'vitest'
import { PassThrough } from 'stream'
import { CliShell } from '@kingjs/cli-shell'
import { PassThrough } from 'stream'
import { 
  compareStreams, 
  CliVitestPaths, 
  CliVitestPojo 
} from '@kingjs/cli-test'

import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const __paths = new CliVitestPaths(import.meta)
const __pojo = new CliVitestPojo(__paths, { overwrite: true })

const HELLO_WORLD = 'hello world'
const HELLO = 'hello'
const WORLD = 'world'

describe('redirect-errors', () => {
  let $

  beforeEach(() => { $ = new CliShell() })

  it('bad-name', async () => {
    expect(() => {
      $(async $ => {
        return
      })({ stdbad: null })
    }).toThrow('Invalid redirect target: stdbad')
  })
  
  it('bad-stdin-value', async () => {
    expect(() => {
      $(async $ => {
        return
      })({ stdin: { } })
    }).toThrow('Invalid redirection type: Object.')
  })
  
  it('bad-stdout-value', async () => {
    expect(() => {
      $(async $ => {
        return
      })({ stdout: { } })
    }).toThrow('Invalid redirection type: Object.')
  })
})

describe('redirect', () => {
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
    const resultPath = join(`${__paths.rootDir}`, `out.txt`)

    await $(async $ => {
      $.stdout.write(HELLO_WORLD)
    })({ stdout: resultPath })

    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })({ stdin: resultPath })
    unlink(resultPath)
  })
})

describe('supplant', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('path', async () => {
    const resultPath = join(`${__paths.rootDir}`, `supplanted.txt`)
    const passThrough = new PassThrough()

    // per bash,
    //    $ : > ./supplanted.txt > /dev/null 
    // will still create the file even if the output is supplanted by 
    // a nother redirect (e.g. to /dev/null)
    await $(async $ => {
      $.stdout.write(HELLO_WORLD)
    })({ stdout: resultPath })
      ({ stdout: passThrough })

    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)

    // result path should still have been created
    expect(existsSync(resultPath)).toBe(true)
    unlink(resultPath)
  })
})

describe('redirect-copy', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('buffer', async () => {
    await $(async $ => {
      await compareStreams($.stdin, HELLO_WORLD)
    })({ stdin: Buffer.from(HELLO_WORLD) })
  })
})

describe('stdout-redirect-coercion', () => {
  // Test redirects that have a known javascript form. For example,
  // $(...)({ stdin: 'hello world' }) coerces the string to an in
  // memory stream.
  let $

  beforeEach(() => { $ = new CliShell() })

  it('stderr-to-stdout', async () => {
    const passThrough = new PassThrough()
    await $(async $ => {
      $.stdout.write(HELLO_WORLD)
    })({ stderr: passThrough, stdout: 2 })

    // stdout copy of resource in stderr should not be closed by subshell
    expect(passThrough.readableEnded).toBe(false)

    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })
  
  it('inherited-stderr-to-stdout', async () => {
    await $(
      async $ => {
        await $(async $ => {
          // stderr is a copy of parent stdout
          $.stderr.write(HELLO_WORLD)
        })({ stderr: 1 })

        // stdout should not have been closed by child subshell
        expect($.stdout.readableEnded).toBe(false)
      },
      async $ => {
        await compareStreams($.stdin, HELLO_WORLD)
      },
    )
  })
})

describe('stdin-redirect-coercion', () => {
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

describe('debug', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('slots', async ({ task }) => {
    const subshell = $(() => { })
    subshell({ stdin: null })
    subshell({ stdout: null })
    subshell({ stderr: null })
    await __pojo.expect(subshell, task)
  })
})
