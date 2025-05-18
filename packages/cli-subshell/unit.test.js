import { describe, it, expect, beforeEach } from 'vitest'
import { PassThrough } from 'stream'
import { CliShell } from '@kingjs/cli-shell'
import { Readable, PassThrough } from 'stream'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { once } from 'events'
import { compareStreams } from '@kingjs/cli-test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const NODE = process.execPath
const HELLO_WORLD = 'hello world'
const HELLO = 'hello'
const WORLD = 'world'

describe('spawn', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('proc', async () => {
    const passThrough = new PassThrough()
    await $`${NODE} -e ${'process.stdout.write("hello world")'}`
      (passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })

  it('proc-proc', async () => {
    const passThrough = new PassThrough()
    await $(
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      $`${NODE} -e ${'console.log(require("fs").readFileSync(0,"utf8"))'}`
    )(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD + '\n')
  })

  it('proc-proc-proc', async () => {
    const passThrough = new PassThrough()
    await $(
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      $`${NODE} -e ${'console.log(require("fs").readFileSync(0,"utf8"))'}`,
      $`${NODE} -e ${'console.log(require("fs").readFileSync(0,"utf8"))'}`
    )(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD + '\n\n')
  })
})

describe('function', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('func', async () => {
    const passThrough = new PassThrough()
    await $(async $ => await $.stdout.write(HELLO_WORLD))
      (passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })

  it('func-func', async () => {
    await $(
      async $ => await $.stdout.write(HELLO_WORLD),
      async $ => await compareStreams($.stdin, HELLO_WORLD)
    )
  })
  
  it('func-func-func', async () => {
    await $(
      async $ => await $.stdout.write(HELLO_WORLD),
      async $ => { 
        $.stdin.pipe($.stdout)
        await once($.stdin, 'end') 
      },
      async $ => await compareStreams($.stdin, HELLO_WORLD)
    )
  })

  it('return-codes', async () => {
    const result = await $(
      async $ => { return 0 },
      async $ => { return 1 },
      async $ => { return 2 },
    )
    expect(result).toEqual([0, 1, 2])
  })
})

describe('spawn-function', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('proc-func', async () => {
    await $(
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      async $ => await compareStreams($.stdin, HELLO_WORLD)
    )
  })

  it('func-proc', async () => {
    const passThrough = new PassThrough()
    await $(
      async $ => await $.stdout.write(HELLO_WORLD),
      $`${NODE} -e ${'process.stdin.pipe(process.stdout)'}`
    )(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })

  it('func-proc-func', async () => {
    await $(
      async $ => await $.stdout.write(HELLO_WORLD),
      $`${NODE} -e ${'process.stdin.pipe(process.stdout)'}`,
      async $ => await compareStreams($.stdin, HELLO_WORLD)
    )
  })
  
  it('proc-func-proc', async () => {
    const passThrough = new PassThrough()
    await $(
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      async $ => { 
        $.stdin.pipe($.stdout)
        await once($.stdin, 'end') 
      },
      $`${NODE} -e ${'process.stdin.pipe(process.stdout)'}`
    )(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })
})

describe('normalize', () => {
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
