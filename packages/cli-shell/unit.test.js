import { describe, it, expect, beforeEach } from 'vitest'
import { CliShell } from '@kingjs/cli-shell'
import { PassThrough, Readable } from 'stream'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { compareStreams } from '@kingjs/cli-test'
import path from 'path'

const __fileName = fileURLToPath(import.meta.url)
const __rootDir = dirname(__fileName)

const __pojoDir = path.join(__rootDir, 'pojo')
const __pojoExt = 'pojo'
async function savePojo(subshell, fileName) {
  const filePath = path.join(__pojoDir, fileName + '.' + __pojoExt)
  await subshell.__dump({ path: filePath })
}

const NODE = process.execPath
const HELLO_WORLD = 'hello world'
const HELLO = 'hello'
const WORLD = 'world'

describe('Scope', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('add', async () => {
    await $.scope({ HELLO: HELLO })($ => {
      expect($.env.HELLO).toBe(HELLO)
    })
    expect($.env.HELLO).toBe(undefined)
  })
  
  it('add', async () => {
    $.env.HELLO = HELLO
    await $.scope($ => {
      expect($.env.HELLO).toBe(HELLO)

      $.env.HELLO = WORLD
      expect($.env.HELLO).toBe(WORLD)
    })
    expect($.env.HELLO).toBe(HELLO)
  })

  it('remove', async () => {
    $.env.HELLO = HELLO
    await $.scope($ => {
      expect($.env.HELLO).toBe(HELLO)

      // unlike bash unset, delete exposes the inherited value
      delete $.env.HELLO 
      expect($.env.HELLO).toBe(HELLO)
    })
    expect($.env.HELLO).toBe(HELLO)
  })

  it('add-add', async () => {
    await $.scope({ HELLO: HELLO })(async $ => {
      expect($.env.HELLO).toBe(HELLO)

      await $.scope({ WORLD: WORLD })($ => {
        expect($.env.HELLO).toBe(HELLO)
        expect($.env.WORLD).toBe(WORLD)
      })
      expect($.env.HELLO).toBe(HELLO)
      expect($.env.WORLD).toBe(undefined)
    })
    expect($.env.HELLO).toBe(undefined)
    expect($.env.WORLD).toBe(undefined)
  })
})

describe('Cwd', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('default', async () => {
    expect($.cwd).toBe(process.cwd())
  })

  it('pushd-self', async () => {
    $.pushd('.')
    expect($.cwd).toBe(process.cwd())
  })

  it('pushd-relative', async () => {
    $.pushd(HELLO)
    const hello = path.join(process.cwd(), HELLO)
    expect($.cwd).toBe(hello)
  })

  it('pushd-absolute', async () => {
    const hello = path.join(process.cwd(), HELLO)
    $.pushd(hello)
    expect($.cwd).toBe(hello)
  })

  it('pushd-normalize', async () => {
    const up = path.join(process.cwd(), '..')
    $.pushd('..')
    expect($.cwd).toBe(up)
  })

  it('dirs', async () => {
    $.pushd(HELLO)
    const hello = path.join(process.cwd(), HELLO)
    const dirs = [hello, process.cwd()]
    expect($.dirs).toEqual(dirs)
  })

  it('dirs-is-a-copy', async () => {
    expect($.dirs).not.toBe($.dirs)
  })

  it('popd', async () => {
    $.pushd(HELLO)
    const hello = path.join(process.cwd(), HELLO)
    expect($.cwd).toBe(hello)

    $.popd()
    expect($.cwd).toBe(process.cwd())
  })

  it('popd-last', async () => {
    $.popd()
    expect($.cwd).toBe(process.cwd())
  })
})

describe('Streams', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('stdin', async () => {
    expect($.stdin).toBe($.getStream(0))
    expect($.stdin).toBe($.getStream('stdin'))
  })

  it('stdout', async () => {
    expect($.stdout).toBe($.getStream(1))
    expect($.stdout).toBe($.getStream('stdout'))
  })

  it('stderr', async () => {
    expect($.stderr).toBe($.getStream(2))
    expect($.stderr).toBe($.getStream('stderr'))
  })

  it('invalid-slots', async () => {
    expect(() => $.getStream(3)).toThrow()
    expect(() => $.getStream(-1)).toThrow()
    expect(() => $.getStream('invalid')).toThrow()
  })
})

describe('Expand', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('expand', async () => {
    const args = $.expand('bash', '-c', 'echo', HELLO_WORLD)
    expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
  })

  it('alias', async () => {
    $.alias.set('shell', (...args) => ['bash', ...args])
    const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
    expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
  })

  it('alias-alias', async () => {
    $.alias.set('shell', (...args) => ['bash', ...args])
    const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
    expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])

    await $($ => {
      const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
      expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])

      {
        $.alias.set('shell', (...args) => ['sh', ...args])
        const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
        expect(args).toEqual(['sh', '-c', 'echo', HELLO_WORLD])
      }
    })

    {
      const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
      expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
    }
  })
})

describe('Spawn', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('node', async () => {
    const passThrough = new PassThrough()
    await $.spawn(
      NODE, '-e', `process.stdout.write("${HELLO_WORLD}")`)
      (passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })
  
  it('alias', async () => {
    $.alias.set('node', (...args) => [NODE, '-e', ...args])

    const passThrough = new PassThrough()
    await $.spawn(
      'node', `process.stdout.write("${HELLO_WORLD}")`)
      (passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })
})

describe('subshell', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('null', async () => {
    await $.subshell()
  })

  it('function', async () => {
    let called = false
    await $.subshell(() => called = true)
    expect(called).toBe(true)
  })
  
  it('function-function', async () => {
    let called = false
    await $.subshell($.subshell(() => called = true))
    expect(called).toBe(true)
  })

  it('bad-subshell', async () => {
    expect(() => $.subshell(1)).toThrow()
    expect(() => $.subshell('hello')).toThrow()
  })
})

describe('pipeline', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('one-stage', async () => {
    const stage = $`${NODE} -e ${'process.stdout.write("hello world")'}`
    const pipeline = $.pipeline(stage)
    expect(pipeline).toBe(stage)
    await savePojo(pipeline, 'one-stage')
  })

  it('two-stage', async () => {
    const passThrough = new PassThrough()
    const stages = [
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      $`${NODE} -e ${'console.log(require("fs").readFileSync(0,"utf8"))'}`,
    ]
    const stage = $.pipeline(...stages)(passThrough)

    const [ first, last ] = stages
    expect(stage).toBe(last)
    await savePojo(last, 'two-stage')
  })
  
  it('three-stage', async () => {
    const passThrough = new PassThrough()
    const stages = [
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      $`${NODE} -e ${'console.log(require("fs").readFileSync(0,"utf8"))'}`,
      $`${NODE} -e ${'console.log(require("fs").readFileSync(0,"utf8"))'}`,
    ]
    const stage = $.pipeline(...stages)(passThrough)

    const [ first, middle, last ] = stages
    expect(stage).toBe(last)
    await savePojo(last, 'three-stage')
  })
})
