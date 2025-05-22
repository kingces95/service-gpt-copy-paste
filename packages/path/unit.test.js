import { Path } from './index.js'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { dirname, basename, extname, normalize, sep } from 'path'
import { fileURLToPath } from 'url'
import { sleep } from '@kingjs/sleep'

expect.extend({
  toBeEquals(received, expected) {
    const pass = typeof received?.equals === 'function' && received.equals(expected);
    return {
      pass,
      message: () =>
        `expected ${received()} to ${pass ? '' : 'not '} equal ${expected()}`
    }
  }
})

describe('constructor', () => {
  it('should create a dot path by default.', () => {
    const path = new Path()
    expect(path()).toBe('.')
  })
  it('should create a dot path when given a dot.', () => {
    const path = new Path('.')
    expect(path()).toBe('.')
  })
  it('should create a dot path when given an empty string.', () => {
    const path = new Path('')
    expect(path()).toBe('.')
  })
  it('should normalize double slashes.', () => {
    const raw = 'foo//bar\\baz'
    const path = new Path(raw)
    expect(path()).toBe(normalize(raw))
  })
  it('should "normalize" dot slash like node.', () => {
    const raw = `.${sep}`
    const path = new Path(raw)
    expect(path()).toBe(normalize(raw))

    // note: node does not normalize this
    expect(normalize(raw)).toBe(raw)
  })
  it('should normalize slash dot like node.', () => {
    const raw = `${sep}.`
    const path = new Path(raw)
    expect(path()).toBe(sep)
  })
  it('should normalize backtracking.', () => {
    const raw = `base${sep}..${sep}foo`
    const path = new Path(raw)
    expect(path()).toBe(`foo`)
  })
})

describe('static property', () => {
  describe('current', () => {
    it('should be a dot path.', () => {
      expect(Path.current()).toBe('.')
    })
    it('should be relative.', () => {
      expect(Path.current.isRelative).toBe(true)
      expect(Path.current.isAbsolute).toBe(false)
    })
  })
  describe('root', () => {
    it('should be a root path.', () => {
      expect(Path.root()).toBe(normalize('/'))
    })
    it('should be absolute.', () => {
      expect(Path.root.isRelative).toBe(false)
      expect(Path.root.isAbsolute).toBe(true)
    })
  })
  describe('parent', () => {
    it('should be a parent path.', () => {
      expect(Path.parent()).toBe(normalize('..'))
    })
    it('should be relative.', () => {
      expect(Path.parent.isRelative).toBe(true)
      expect(Path.parent.isAbsolute).toBe(false)
    })
  })
})

describe('static method', () => {
  describe('create', () => {
    it('should crate a path given a string.', () => {
      const path = Path.create('foo')
      expect(path()).toBe(normalize('foo'))
    })
    it('should crate a path given a URL.', () => {
      const url = new URL('foo', 'file://')
      const path = Path.create(url)
      expect(path()).toBe(normalize('/foo'))
    })
    it('should crate a path given a Path.', () => {
      const path1 = new Path('foo')
      const path2 = Path.create(path1)
      expect(path1).toBeEquals(path2)
    })
    it('should throw if given an invalid argument.', () => {
      expect(() => Path.create({}))
        .toThrow('Path must be a Path, string, or URL.')
    })
  })
  describe('createRelative', () => {
    it('should create a relative path.', () => {
      const path = Path.createRelative('foo', 'bar')
      expect(path()).toBe(normalize('foo/bar'))
      expect(path.isRelative).toBe(true)
      expect(path.isAbsolute).toBe(false)
    })
  })
  describe('createAbsolute', () => {
    it('should create an absolute path.', () => {
      const path = Path.createAbsolute('foo', 'bar')
      expect(path()).toBe(normalize('/foo/bar'))
      expect(path.isRelative).toBe(false)
      expect(path.isAbsolute).toBe(true)
    })
  })
})

describe('instance', () => {
  it('should be a functor.', () => {
    const path = new Path('foo')
    expect(path).toBeInstanceOf(Path)
  })
  it('should be callable.', () => {
    const path = new Path('foo')
    expect(path()).toBe(normalize('foo'))
  })
  it('should be callable with multiple arguments.', () => {
    const path = new Path('foo')
    expect(path('bar', 'baz')()).toBe(normalize('foo/bar/baz'))
  })
  it('should be chainable.', () => {
    const path = new Path('foo')
    expect(path('bar')('baz')()).toBe(normalize('foo/bar/baz'))
  })
  it('should return the path when called with no arguments.', () => {
    const path = new Path('foo')
    expect(path()).toBe(normalize('foo'))
    expect(path('bar')()).toBe(normalize('foo/bar'))
    expect(path('bar')('baz')()).toBe(normalize('foo/bar/baz'))
  })
  it('should take multipule multi-segment relative paths.', () => {
    const path = new Path('foo')
    expect(path('bar/baz')('qux/quux')()).toBe(normalize('foo/bar/baz/qux/quux'))
  })
  it('should adopt the right most absolute path as the base.', () => {
    const path = new Path('foo')
    expect(path('/baz')('/qux')('moo')()).toBe(normalize('/qux/moo'))
  })
})

describe('segments', () => {

  it('should return a dot element for the current path.', () => {
    expect(Path.current.segments).toEqual(['.'])
  })
  it('should return an empty array for the root path.', () => {
    expect(Path.root.segments).toEqual([])
  })
  it('should return an element for each segment of a relative path.', () => {
    const path = new Path('./foo/bar/baz')
    expect(path.segments).toEqual(['foo', 'bar', 'baz'])
  })
  it('should return an element for each segment of an absolute path.', () => {
    const path = new Path('/foo/bar/baz')
    // could have chosen ['/','foo','bar'] like others but choose to
    // let the client decide if they want to include the root; in other
    // words, segments is *not* a serialization of the path.
    expect(path.segments).toEqual(['foo', 'bar', 'baz'])
  })
})

describe('relative path a/b/c relativeTo', () => {
  let $
  beforeEach(() => { $ = new Path('a/b/c') })
  const seg = process.cwd().split(sep).filter(Boolean)

  it('a/b/e should be ../c.', () => {
    expect($.relativeTo('a/b/e')()).toBe(normalize('../c'))
  })
  it('a/b should be c.', () => {
    expect($.relativeTo('a/b')()).toBe(normalize('c'))
  })
  it('a/b/c should be .', () => {
    expect($.relativeTo('a/b/c')()).toBe(normalize('.'))
  })
  it('a/b/c/d should be ..', () => {
    expect($.relativeTo('a/b/c/d')()).toBe(normalize('..'))
  })
  it('.. should be pwd.at(-1)/a/b/c.', () => {
    const actual = $.relativeTo('..')()
    const expected = normalize(`${seg.at(-1)}/a/b/c`)
    expect(actual).toBe(expected)
  })
  it('/../.. should be pwd.at(-1)/a/b/c.', () => {
    const actual = $.relativeTo('..')()
    const expected = normalize(`${seg.at(-1)}/a/b/c`)
    expect(actual).toBe(expected)
  })
  it('should have null ino and dev values.', async () => {
    expect(await $.ino()).toBe(null)
    expect(await $.dev()).toBe(null)
  })
  it('should be equals to itself.', () => {
    expect($.equals($)).toBe(true)
  })
  it('should be equals to itself with a different constructor.', () => {
    expect($.equals(Path.create($))).toBe(true)
  })
  it('should not be equals to a different path.', () => {
    const other = new Path('foo/bar/baz')
    expect($.equals(other)).toBe(false)
  })
  it('should not be equals to the wrong type.', () => {
    const other = { value: 'foo/bar/baz' }
    expect($.equals(other)).toBe(false)
  })
})

describe('absolute path /a/b/c relativeTo', () => {
  let $
  beforeEach(() => { $ = new Path('/a/b/c') })
  let cwd = process.cwd()

  it('/a/b/c should be dot.', () => {
    expect($.relativeTo('/a/b/c')()).toBe(normalize('.'))
  })
  it('/a/b should be c.', () => {
    expect($.relativeTo('/a/b')()).toBe(normalize('c'))
  })
  it('/a/b/e should be ../c.', () => {
    expect($.relativeTo('/a/b/e')()).toBe(normalize('../c'))
  })
  it('/a/b/c/d should be ..', () => {
    expect($.relativeTo('/a/b/c/d')()).toBe(normalize('..'))
  })
  it('cwd should be ../../.. ... /a/b.', () => {
    const length = cwd.split(sep).length - 1
    const ups = Array.from({ length }, (_, i) => i) .map(() => '..').join(sep)
    expect($.relativeTo(cwd)()).toBe(normalize(`${ups}/a/b/c`))
  })
})

describe('relative path foo/bar/baz.js', () => {
  let $
  beforeEach(() => { $ = new Path('foo/bar/baz.js') })

  it('should be relative.', () => {
    expect($.isRelative).toBe(true)
    expect($.isAbsolute).toBe(false)
  })
  it('should have a value of foo/bar/baz.js.', () => {
    const expected = normalize('foo/bar/baz.js')
    expect($.value).toBe(expected)
    expect($.toString()).toBe(expected)
    expect($()).toBe(expected)
  })
  it('should have a name of baz.js.', () => {
    expect($.name).toBe('baz.js')
  })
  it('should have a basename of baz.', () => {
    expect($.basename).toBe('baz')
  })
  it('should have an extension of .js.', () => {
    expect($.extension).toBe('.js')
  })
  it('should have a parent of foo/bar.', () => {
    const expected = normalize('foo/bar')
    expect($.parent()).toBe(expected)
  })
  it('should have segments of foo, bar, baz.js.', () => {
    expect($.segments).toEqual(['foo', 'bar', 'baz.js'])
  })

  // predicates
  it('should not exist.', async () => {
    expect(await $.exists()).toBe(false)
  })
  it('should report empty.', async () => {
    expect(await $.isEmpty()).toBe(true)
  })
  it('should not be a file, directory, or link.', async () => {
    expect(await $.isFile()).toBe(false)
    expect(await $.isDirectory()).toBe(false)
    expect(await $.isLink()).toBe(false)
  })
  it('should not be readable, writable, or executable.', async () => {
    expect(await $.isReadable()).toBe(false)
    expect(await $.isWritable()).toBe(false)
    expect(await $.isExecutable()).toBe(false)
  })

  // timestamps
  it('should return null for all dates.', async () => {
    expect(await $.modifiedDate()).toBe(null)
    expect(await $.creationDate()).toBe(null)
    expect(await $.accessDate()).toBe(null)
    expect(await $.changeDate()).toBe(null)
  })
  it('should return null for all times.', async () => {
    expect(await $.modifiedTime()).toBe(null)
    expect(await $.creationTime()).toBe(null)
    expect(await $.accessTime()).toBe(null)
    expect(await $.changeTime()).toBe(null)
  })

  // owners
  it('should return null for all owners.', async () => {
    expect(await $.ownerUserId()).toBe(null)
    expect(await $.ownerGroupId()).toBe(null)
  })

  // size
  it('should return null for size.', async () => {
    expect(await $.size()).toBe(null)
  })
})

describe('absolute path /foo/bar/baz.js', () => {
  let $
  beforeEach(() => { $ = new Path('/foo/bar/baz.js') })

  it('should not be relative.', () => {
    expect($.isRelative).toBe(false)
    expect($.isAbsolute).toBe(true)
  })
  it('should have a value of /foo/bar/baz.js.', () => {
    const expected = normalize('/foo/bar/baz.js')
    expect($.value).toBe(expected)
    expect($.toString()).toBe(expected)
    expect($()).toBe(expected)
  })
  it('should have a name of baz.js.', () => {
    expect($.name).toBe('baz.js')
  })
  it('should have a basename of baz.', () => {
    expect($.basename).toBe('baz')
  })
  it('should have an extension of .js.', () => {
    expect($.extension).toBe('.js')
  })
  it('should have a parent of /foo/bar.', () => {
    const expected = normalize('/foo/bar')
    expect($.parent()).toBe(expected)
  })
  it('should have segments of foo, bar, baz.js.', () => {
    expect($.segments).toEqual(['foo', 'bar', 'baz.js'])
  })

  // predicates
  it('should not exist.', async () => {
    expect(await $.exists()).toBe(false)
  })
  it('should report empty.', async () => {
    expect(await $.isEmpty()).toBe(true)
  })
  it('should not be a file, directory, or link.', async () => {
    expect(await $.isFile()).toBe(false)
    expect(await $.isDirectory()).toBe(false)
    expect(await $.isLink()).toBe(false)
  })
  it('should not be readable, writable, or executable.', async () => {
    expect(await $.isReadable()).toBe(false)
    expect(await $.isWritable()).toBe(false)
    expect(await $.isExecutable()).toBe(false)
  })

  // timestamps
  it('should return null for all dates.', async () => {
    expect(await $.modifiedDate()).toBe(null)
    expect(await $.creationDate()).toBe(null)
    expect(await $.accessDate()).toBe(null)
    expect(await $.changeDate()).toBe(null)
  })
  it('should return null for all times.', async () => {
    expect(await $.modifiedTime()).toBe(null)
    expect(await $.creationTime()).toBe(null)
    expect(await $.accessTime()).toBe(null)
    expect(await $.changeTime()).toBe(null)
  })

  // owners
  it('should return null for all owners.', async () => {
    expect(await $.ownerUserId()).toBe(null)
    expect(await $.ownerGroupId()).toBe(null)
  })

  // size
  it('should return null for size.', async () => {
    expect(await $.size()).toBe(null)
  })
})

describe('dot path', () => {
  let $
  const thisFile = fileURLToPath(import.meta.url)
  const thisDir = dirname(thisFile)
  beforeEach(() => { $ = new Path('.') })

  it('should have a realpath equal to cwd.', async () => {
    const actual = new Path(process.cwd())
    const realPath = await $.realPath()
    expect(realPath()).toBe(actual())
  })
  it('should resolve to cwd (resolve uses pwd).', async () => {
    const expected = new Path(process.cwd())
    const actual = await $.resolve()
    expect(actual()).toBe(expected())
  })
  it('should resolve to cwd/foo if refined by foo.', async () => {
    const expected = new Path(process.cwd())('foo')
    const actual = await $.resolve('foo')
    expect(actual()).toBe(expected())
  })
  it('should be a directory (stats uses pwd).', async () => {
    expect(await $.isDirectory()).toBe(true)
  })
  it('should match ino with cwd (stats uses pwd).', async () => {
    const expected = await $.ino()
    const actual = await $.ino()
    expect(actual).toBe(expected)
  })
})

describe('path of directory hosting this file', () => {
  let $
  const thisFile = fileURLToPath(import.meta.url)
  const thisDir = dirname(thisFile)
  beforeEach(() => { $ = new Path(thisDir) })

  it('should be dirname of this file.', () => {
    expect($()).toBe(dirname(thisFile))
  })
  it('should have a parent that is dirname of this dir.', () => {
    expect($.parent()).toBe(dirname(thisDir))
  })
  it('should have a basename that is basename of this dir.', () => {
    expect($.basename).toBe(basename(thisDir))
  })
  it('should have a basename that equals the name.', () => {
    expect($.basename).toBe($.name)
  })
  it('should have an empty extension.', () => {
    expect($.extension).toBe('')
  })

  // predicates
  it('should exist.', async () => {
    expect(await $.exists()).toBe(true)
  })
  it('should report empty.', async () => {
    expect(await $.isEmpty()).toBe(true)
  })
  it('should be a directory, not a file, or link.', async () => {
    expect(await $.isDirectory()).toBe(true)
    expect(await $.isFile()).toBe(false)
    expect(await $.isLink()).toBe(false)
  })
  it('should be readable, writable, and executable.', async () => {
    expect(await $.isReadable()).toBe(true)
    expect(await $.isWritable()).toBe(true)
    expect(await $.isExecutable()).toBe(true)
  })

  // date/time
  it('should return Date for all dates.', async () => {
    expect(await $.modifiedDate()).toBeInstanceOf(Date)
    expect(await $.creationDate()).toBeInstanceOf(Date)
    expect(await $.accessDate()).toBeInstanceOf(Date)
    expect(await $.changeDate()).toBeInstanceOf(Date)
  })
  it('should return number for all times.', async () => {
    expect(typeof await $.modifiedTime()).toBe('number')
    expect(typeof await $.creationTime()).toBe('number')
    expect(typeof await $.accessTime()).toBe('number')
    expect(typeof await $.changeTime()).toBe('number')
  })

  it('should be created before modified.', async () => {
    const ctime = await $.creationTime()
    const mtime = await $.modifiedTime()
    expect(ctime).toBeLessThanOrEqual(mtime)
  })
  it('should be accessed before modified.', async () => {
    const atime = await $.accessTime()  
    const mtime = await $.modifiedTime()
    expect(mtime).toBeLessThanOrEqual(atime)
  })
  it('should be created before changed.', async () => {
    const ctime = await $.creationTime()
    const mtime = await $.changeTime()  
    expect(ctime).toBeLessThanOrEqual(mtime)
  })

  // owners
  it('should return number for all owners.', async () => {
    expect(typeof await $.ownerUserId()).toBe('number')
    expect(typeof await $.ownerGroupId()).toBe('number')
  })

  // size
  it('should return zero for size.', async () => {
    expect(await $.size()).toBe(0)
  })
})

describe('path of file hosting this file', () => {
  let $
  const thisFile = fileURLToPath(import.meta.url)
  const thisDir = dirname(thisFile)
  beforeEach(() => { $ = new Path(thisFile) })

  it('should have a path matching this file.', () => {
    expect($()).toBe(thisFile)
  })
  it('should have a parent that is dirname of this dir.', () => {
    expect($.parent()).toBe(thisDir)
  })
  it('should have a name that is basename of this file.', () => {
    expect($.name).toBe(basename(thisFile))
  })
  it('should have an extension that is extname of this file.', () => {
    expect($.extension).toBe(extname(thisFile))
  })
  it('should have a basename that is the basename less extname of this file.', () => {
    expect($.basename).toBe(basename(thisFile, extname(thisFile)))
  })
  it('should have segments that are the segments of this file.', () => {
    expect($.segments).toEqual(thisFile.split(sep).filter(Boolean))
  })

  // predicates
  it('should exist.', async () => {
    expect(await $.exists()).toBe(true)
  })
  it('should not be empty.', async () => {
    expect(await $.isEmpty()).toBe(false)
  })
  it('should be a file, not a directory or link.', async () => {
    expect(await $.isFile()).toBe(true)
    expect(await $.isDirectory()).toBe(false)
    expect(await $.isLink()).toBe(false)
  })
  it('should be readable, writable, and executable.', async () => {
    expect(await $.isReadable()).toBe(true)
    expect(await $.isWritable()).toBe(true)
    expect(await $.isExecutable()).toBe(true)
  })

  // date/time
  it('should return Date for all dates.', async () => {
    expect(await $.modifiedDate()).toBeInstanceOf(Date)
    expect(await $.creationDate()).toBeInstanceOf(Date)
    expect(await $.accessDate()).toBeInstanceOf(Date)
    expect(await $.changeDate()).toBeInstanceOf(Date)
  })
  it('should return number for all times.', async () => {
    expect(typeof await $.modifiedTime()).toBe('number')
    expect(typeof await $.creationTime()).toBe('number')
    expect(typeof await $.accessTime()).toBe('number')
    expect(typeof await $.changeTime()).toBe('number')
  })

  it('should be created before modified.', async () => {
    const ctime = await $.creationTime()
    const mtime = await $.modifiedTime()
    expect(ctime).toBeLessThanOrEqual(mtime)
  })
  it('should be accessed before modified.', async () => {
    const atime = await $.accessTime()  
    const mtime = await $.modifiedTime()
    expect(mtime).toBeLessThanOrEqual(atime)
  })
  it('should be created before changed.', async () => {
    const ctime = await $.creationTime()
    const mtime = await $.changeTime()  
    expect(ctime).toBeLessThanOrEqual(mtime)
  })

  // owners
  it('should return number for all owners.', async () => {
    expect(typeof await $.ownerUserId()).toBe('number')
    expect(typeof await $.ownerGroupId()).toBe('number')
  })

  // size
  it('should return a non-zero size.', async () => {
    expect(await $.size()).toBeGreaterThan(0)
  })
})

describe('temporary path', () => {
  let $
  beforeEach(() => { $ = Path.createTemp() })
  afterEach(() => $.remove())

  it('should not exist.', async () => {
    expect(await $.exists()).toBe(false)
  })
  it('should exist as a file after touch.', async () => {
    await $.touch()
    expect(await $.exists()).toBe(true)
  })
  it('should exist as a directory after make.', async () => {
    await $.make()
    expect(await $.exists()).toBe(true)
    expect(await $.isDirectory()).toBe(true)
  })
  it('should not throw on remove or dispose.', async () => {
    await $.remove()
    expect(await $.exists()).toBe(false)
    await $.dispose()
    expect(await $.exists()).toBe(false)
  })
  it('should be empty with size zero after touch.', async () => {
    await $.touch()
    expect(await $.isEmpty()).toBe(true)
    expect(await $.size()).toBe(0)
  })
  it('should be readable, writable, and executable after touch.', async () => {
    await $.touch()
    expect(await $.isReadable()).toBe(true)
    expect(await $.isWritable()).toBe(true)
    expect(await $.isExecutable()).toBe(true)
  })
})

describe('temporary sub path', () => {
  let $
  beforeEach(() => { $ = Path.createTemp()('foo') })
  afterEach(() => $.remove())

  it('should not exist.', async () => {
    expect(await $.exists()).toBe(false)
  })
  it('should not have a parent that exists.', async () => {
    expect(await $.parent.exists()).toBe(false)
  })
  it('should exist as a directory after make.', async () => {
    await $.make()
    expect(await $.exists()).toBe(true)
    expect(await $.isDirectory()).toBe(true)
  })
})

describe('temporary file', () => {
  let $
  beforeEach(async () => { $ = await Path.createTempFile() })
  afterEach(() => $.remove())

  it('should be readable, writable, and executable after touch.', async () => {
    expect(await $.isReadable()).toBe(true)
    expect(await $.isWritable()).toBe(true)
    expect(await $.isExecutable()).toBe(true)
  })
  it('should not exist after unlink.', async () => {
    expect(await $.exists()).toBe(true)
    await $.unlink()
    expect(await $.exists()).toBe(false)
  })
  it('should not exist after remove.', async () => {
    expect(await $.exists()).toBe(true)
    await $.remove()
    expect(await $.exists()).toBe(false)
  })
  it('should not exist after dispose.', async () => {
    expect(await $.exists()).toBe(true)
    await $.dispose()
    expect(await $.exists()).toBe(false)
  })
  it('should be moved after rename.', async () => {
    const target = Path.createTemp()
    const target$ = await $.rename(target)
    expect(target()).toBe(target$())
    expect(await $.exists()).toBe(false)
    expect(await target.exists()).toBe(true)
    await target.remove()
  })
  it('should be copied after copy.', async () => {
    const target = Path.createTemp()
    await $.copy(target)
    expect(await $.exists()).toBe(true)
    expect(await target.exists()).toBe(true)
    await target.remove()
  }),
  it('should be empty with size zero.', async () => {
    expect(await $.isEmpty()).toBe(true)
    expect(await $.size()).toBe(0)
  })
  it('should have content after write that can be read.', async () => {
    const content = 'foo'
    await $.write(content)
    expect(await $.read()).toBe(content)
    expect(await $.isEmpty()).toBe(false)
    expect(await $.size()).toBe(content.length)
  })
  it('should have content after appending twice that can be read.', async () => {
    const content = 'foo'
    await $.append(content)
    await $.append(content)
    expect(await $.read()).toBe(content + content)
    expect(await $.isEmpty()).toBe(false)
    expect(await $.size()).toBe(content.length * 2)
  })
  it('should be able to write and read json using json methods.', async () => {
    const content = { foo: 'bar' }
    await $.stringify(content)
    expect(await $.parse()).toEqual(content)
  })
})

describe('temporary directory', () => {
  let $
  beforeEach(async () => { $ = await Path.createTempDir() })
  afterEach(() => $.remove())

  it('should be readable, writable, and executable after make.', async () => {
    expect(await $.isReadable()).toBe(true)
    expect(await $.isWritable()).toBe(true)
    expect(await $.isExecutable()).toBe(true)
  })
  it('should not exist after remove.', async () => {
    expect(await $.exists()).toBe(true)
    await expect($.unlink()).rejects.toThrow()
    await $.remove()
    expect(await $.exists()).toBe(false)
  })
  it('should not exist after dispose.', async () => {
    expect(await $.exists()).toBe(true)
    await $.dispose()
    expect(await $.exists()).toBe(false)
  })
  it('should be moved after rename.', async () => {
    const target = Path.createTemp()
    await $.rename(target)
    expect(await $.exists()).toBe(false)
    expect(await target.exists()).toBe(true)
    await target.remove()
  })
  it('should be able to list files that are created in it via touch.', async () => {
    const file = await $.touch('foo')
    expect(await file.exists()).toBe(true)
    const listing = await $.list()
    const names = listing.map(file => file.name)
    expect(names).toEqual([file.name])
    expect(names).toEqual(await $.list(file => file.name))
  })
})

describe('symlink to directory', () => {
  let $tempDir
  let $linkDir
  beforeEach(async () => { 
    $tempDir = await Path.createTempDir() 
    $linkDir = await $tempDir('my-link').symlink('.')
  })
  afterEach(() => $tempDir.remove())

  it('should be a symlink.', async () => {
    expect(await $linkDir.isLink()).toBe(true)
  })
  it('should have a link value of dot.', async () => {
    const linkValue = await $linkDir.readLink()
    expect(linkValue()).toBe(normalize('.'))
  })
  it('should be a directory.', async () => {
    expect(await $linkDir.isDirectory()).toBe(true)
  })
  it('should be empty.', async () => {
    expect(await $linkDir.isEmpty()).toBe(true)
  })
})

describe('symlink to file', () => {
  let $tempDir
  let $file
  let $linkFile
  beforeEach(async () => { 
    $tempDir = await Path.createTempDir() 
    $file = await $tempDir('foo').touch()
    await sleep(1)
    $linkFile = await $tempDir('my-link').symlink('foo')
  })
  afterEach(() => $tempDir.remove())

  it('should be a symlink.', async () => {
    expect(await $linkFile.isLink()).toBe(true)
  })
  it('should be a file.', async () => {
    expect(await $linkFile.isFile()).toBe(true)
  })
  it('should be empty.', async () => {
    expect(await $linkFile.isEmpty()).toBe(true)
  })
  it('should have matching ino with the file.', async () => {
    const fileIno = await $file.ino()
    const linkIno = await $linkFile.ino()
    expect(fileIno).toBe(linkIno)
  })
  it('should have matching owner id.', async () => {
    const fileOwner = await $file.ownerUserId()
    const linkOwner = await $linkFile.ownerUserId()
    expect(fileOwner).toBe(linkOwner)
  })
  it('should have matching group id.', async () => {
    const fileOwner = await $file.ownerGroupId()
    const linkOwner = await $linkFile.ownerGroupId()
    expect(fileOwner).toBe(linkOwner)
  })
  it('should itself have different ino from file for ino of link itself.', async () => {
    const fileIno = await $file.ino()
    const linkIno = await $linkFile.ino({ ofLink: true })
    expect(fileIno).not.toBe(linkIno)
  })
  it('should itself have matching dev with the file.', async () => {
    // dev is not available on windows
    if (process.platform === 'win32') return
    const fileDev = await $file.dev()
    const linkDev = await $linkFile.dev({ ofLink: true })
    expect(fileDev).toBe(linkDev)
  })
  it('should itself have matching user id with the file.', async () => {
    const fileOwner = await $file.ownerUserId()
    const linkOwner = await $linkFile.ownerUserId({ ofLink: true })
    expect(fileOwner).toBe(linkOwner)
  })
  it('should itself have matching group id with the file.', async () => {
    const fileOwner = await $file.ownerGroupId()
    const linkOwner = await $linkFile.ownerGroupId({ ofLink: true })
    expect(fileOwner).toBe(linkOwner)
  })
  it('should itself have newer modified time than the file.', async () => {
    const fileMtime = await $file.modifiedTime()
    const linkMtime = await $linkFile.modifiedTime({ ofLink: true })
    expect(fileMtime).toBeLessThan(linkMtime)
  })
  it('should itself have newer access time than the file.', async () => {
    const fileAtime = await $file.accessTime()
    const linkAtime = await $linkFile.accessTime({ ofLink: true })
    expect(fileAtime).toBeLessThan(linkAtime)
  })
  it('should itself have newer change time than the file.', async () => {
    const fileCtime = await $file.changeTime()
    const linkCtime = await $linkFile.changeTime({ ofLink: true })
    expect(fileCtime).toBeLessThan(linkCtime)
  })
  it('should itself have newer changed time than the file.', async () => {
    const fileCtime = await $file.changeTime()
    const linkCtime = await $linkFile.changeTime({ ofLink: true })
    expect(fileCtime).toBeLessThan(linkCtime)
  })
  it('should itself have newer modified date than the file.', async () => {
    const fileMtime = await $file.modifiedDate()
    const linkMtime = await $linkFile.modifiedDate({ ofLink: true })
    expect(fileMtime.getTime()).toBeLessThan(linkMtime.getTime())
  })
  it('should itself have new access date than the file.', async () => {
    const fileAtime = await $file.accessDate()
    const linkAtime = await $linkFile.accessDate({ ofLink: true })
    expect(fileAtime.getTime()).toBeLessThan(linkAtime.getTime())
  })  
  it('should itself have new change date than the file.', async () => {
    const fileCtime = await $file.changeDate()
    const linkCtime = await $linkFile.changeDate({ ofLink: true })
    expect(fileCtime.getTime()).toBeLessThan(linkCtime.getTime())
  })
  it('should itself have new created date than the file.', async () => {
    const fileCtime = await $file.creationDate()
    const linkCtime = await $linkFile.creationDate({ ofLink: true })
    expect(fileCtime.getTime()).toBeLessThan(linkCtime.getTime())
  })
  it('should itself not be empty.', async () => {
    expect(await $linkFile.isEmpty({ ofLink: true })).toBe(false)
  })
  it('should itself have size equal to foo.', async () => {
    expect(await $linkFile.size({ ofLink: true })).toBe('foo'.length)
  })

  it('should write to the link and read from the file.', async () => {
    const content = 'foo'
    await $linkFile.write(content)
    expect(await $file.read()).toBe(content)
    expect(await $file.isEmpty()).toBe(false)
    expect(await $file.size()).toBe(content.length)
  })
  it('should write to the file and read from the link.', async () => {
    const content = 'foo'
    await $file.write(content)
    expect(await $linkFile.read()).toBe(content)
    expect(await $linkFile.isEmpty()).toBe(false)
    expect(await $linkFile.size()).toBe(content.length)
  })
  it('should append to the link and read from the file.', async () => {
    const content = 'foo'
    await $file.write(content)

    await $linkFile.append(content)
    expect(await $file.read()).toBe(content + content)
    expect(await $file.isEmpty()).toBe(false)
    expect(await $file.size()).toBe(content.length * 2)
  })
  it('should be renamed and have read link be the same.', async () => {
    const newName = 'my-link2'
    const $linkFile2 = await $linkFile.rename(newName)
    expect(await $linkFile.exists()).toBe(false)
    expect(await $linkFile2.exists()).toBe(true)
    
    const linkValue = await $linkFile2.readLink()
    expect(linkValue()).toBe(normalize('foo'))
  })
  it('should be copied and have read link be the same.', async () => {
    const newName = 'my-link2'
    const linkFile2 = await $linkFile.copy(newName)
    expect(await $linkFile.exists()).toBe(true)
    expect(await linkFile2.exists()).toBe(true)
    expect(await linkFile2.isLink()).toBe(true)

    const linkValue = await $linkFile.readLink()
    const linkValue2 = await linkFile2.readLink()

    expect(linkValue2).toBeEquals(linkValue)
  })
  it('should copy the actual file if dereference set.', async () => {
    const newName = 'my-link2'
    const linkFile2 = await $linkFile.copy(newName, { dereference: true })
    expect(await $linkFile.exists()).toBe(true)
    expect(await linkFile2.exists()).toBe(true)
    expect(await linkFile2.isLink()).toBe(false)
  })
  it('should itself still exist after unlink of the file.', async () => {
    await $file.unlink()
    expect(await $linkFile.isLink()).toBe(true)
    expect(await $linkFile.exists()).toBe(false)
  })
  it('should not exist after unlink of the file if dereference set.', async () => {
    const linkRelValue = await $linkFile.readLink()
    const linkValue = $linkFile.parent(linkRelValue)

    // verify link broken by unlinking the file
    expect(await linkValue.exists()).toBe(true)
    await $file.unlink()
    expect(await linkValue.exists()).toBe(false)

    // mirror behavior of fs.existsSync
    expect(await $linkFile.isLink()).toBe(true)
    const fs = await import('fs')
    expect(fs.existsSync($linkFile())).toBe(false)

    expect(await $linkFile.exists()).toBe(false)
  })
})

describe('A cwd scope', () => {
  it('should require an absolute path.', () => {
    expect(() => Path.withCwd('foo', () => {}))
      .toThrow('Path must be absolute.')
  })
  it('should take an async callback.', async () => {
    const tempDir = await Path.createTempDir() 
    let cwd = null
    await Path.withCwd(tempDir, async () => cwd = Path.cwd())
    expect(cwd).toBeEquals(tempDir)
  })
  it('should take a sync callback.', async () => {
    const tempDir = await Path.createTempDir() 
    let cwd = null
    await Path.withCwd(tempDir, () => cwd = Path.cwd())
    expect(cwd).toBeEquals(tempDir)
  })  
  it('should be nestable.', async () => {
    const tempDir = await Path.createTempDir() 
    let cwd = null
    await Path.withCwd(tempDir, async () => {
      cwd = Path.cwd()
      await Path.withCwd(tempDir('foo'), () => {
        expect(Path.cwd()).toBeEquals(tempDir('foo'))
      })
    })
    expect(cwd).toBeEquals(tempDir)
  })
})

describe('A relative file path in a cwd scope', () => {
  let $tempDir
  let $fooPath
  let $fooRelPath
  beforeEach(async () => { 
    $tempDir = await Path.createTempDir() 
    $fooPath = await $tempDir('foo').touch()
    $fooRelPath = Path.current('foo')
  })
  afterEach(() => $tempDir.remove())

  it('should be a relative path.', () => {
    expect($fooRelPath.isRelative).toBe(true)
    expect($fooRelPath.isAbsolute).toBe(false)
  })
  it('should not exist outside of pwd.', async () =>
    expect(await $fooRelPath.exists()).toBe(false)
  )
  it('should exist.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(await $tempDir('foo').exists()).toBe(true)
      expect(await $fooRelPath.exists()).toBe(true)
    })
  )
  it('should resolve to the absolute file path.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(await $fooRelPath.resolve()).toBeEquals($fooPath)
    })
  )
  it('should have the same ino and dev as the file.', async () =>
    Path.withCwd($tempDir, async () => {
      const ino = await $fooRelPath.ino()
      const dev = await $fooRelPath.dev()
      const fileIno = await $fooPath.ino()
      const fileDev = await $fooPath.dev()
      expect(ino).toBe(fileIno)
      expect(dev).toBe(fileDev)
    }
  ))
  it('should return boolean for access and is readable, etc.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(await $fooRelPath.exists()).toBe(true)
      expect(await $fooRelPath.isReadable()).toBe(true)
      expect(await $fooRelPath.isWritable()).toBe(true)
      expect(await $fooRelPath.isExecutable()).toBe(true)
    })
  )
  it('should return boolean for is file, etc.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(await $fooRelPath.isFile()).toBe(true)
      expect(await $fooRelPath.isDirectory()).toBe(false)
      expect(await $fooRelPath.isLink()).toBe(false)
    })
  )
  it('should return a number for ino and dev.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(typeof await $fooRelPath.ino()).toBe('number')
      expect(typeof await $fooRelPath.dev()).toBe('number')
    })
  )
  it('should return a number for owner user and group id.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(typeof await $fooRelPath.ownerUserId()).toBe('number')
      expect(typeof await $fooRelPath.ownerGroupId()).toBe('number')
    })
  )
  it('should return a number for size.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(typeof await $fooRelPath.size()).toBe('number')
    })
  )
  it('should return a boolean for is empty.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(await $fooRelPath.isEmpty()).toBe(true)
    })
  )
  it('should return a date for modified, etc.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(await $fooRelPath.modifiedDate()).toBeInstanceOf(Date)
      expect(await $fooRelPath.creationDate()).toBeInstanceOf(Date)
      expect(await $fooRelPath.accessDate()).toBeInstanceOf(Date)
      expect(await $fooRelPath.changeDate()).toBeInstanceOf(Date)
    })
  )
  it('should return a number for modified, etc.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(typeof await $fooRelPath.modifiedTime()).toBe('number')
      expect(typeof await $fooRelPath.creationTime()).toBe('number')
      expect(typeof await $fooRelPath.accessTime()).toBe('number')
      expect(typeof await $fooRelPath.changeTime()).toBe('number')
    })
  )
  it('should be listed as a file in the current directory.', async () =>
    Path.withCwd($tempDir, async () => {
      const files = await $tempDir.list()
      expect(files.length).toBe(1)
      expect(files[0].name).toBe('foo')
    })
  )
  it('can be used to copy file to bar in the temp dir.', async () =>
    Path.withCwd($tempDir, async () => {
      const $bar = await $fooRelPath.copy('bar')
      expect(await $bar.exists()).toBe(true)
      expect(await $bar.isFile()).toBe(true)
      expect($bar.isRelative).toBe(true)
      expect(await $fooPath.exists()).toBe(true)
    })
  )
  it('can be used to rename file to bar in the temp dir.', async () =>
    Path.withCwd($tempDir, async () => {
      const $bar = await $fooRelPath.rename('bar')
      expect(await $bar.exists()).toBe(true)
      expect(await $bar.isFile()).toBe(true)
      expect($bar.isRelative).toBe(true)
      expect(await $fooPath.exists()).toBe(false)
    })
  )
  it('can be used to write to the file.', async () =>
    Path.withCwd($tempDir, async () => {
      const content = 'foo'
      await $fooRelPath.write(content)
      expect(await $fooPath.read()).toBe(content)
    })
  )
  it('can be used to write json to the file.', async () =>
    Path.withCwd($tempDir, async () => {
      const content = { foo: 'bar' }
      await $fooRelPath.stringify(content)
      expect(await $fooPath.parse()).toEqual(content)
    })
  )
  it('can be used to read json from the file.', async () =>
    Path.withCwd($tempDir, async () => {
      const content = { foo: 'bar' }
      await $fooPath.stringify(content)
      expect(await $fooRelPath.parse()).toEqual(content)
    })
  )
  it('can be used to append to the file.', async () =>
    Path.withCwd($tempDir, async () => {
      await $fooPath.append('foo')
      await $fooRelPath.append('bar')
      expect(await $fooPath.read()).toBe('foo' + 'bar')
    })
  )
  it('can be used to read the file.', async () =>
    Path.withCwd($tempDir, async () => {
      const content = 'foo'
      await $fooPath.write(content)
      expect(await $fooRelPath.read()).toBe(content)
    })
  )
  it('can be used to unlink then touch create the file.', async () =>
    Path.withCwd($tempDir, async () => {
      await $fooRelPath.unlink()
      expect(await $fooRelPath.exists()).toBe(false)
      expect(await $fooPath.exists()).toBe(false)
      await $fooRelPath.touch()
      expect(await $fooRelPath.exists()).toBe(true)
      expect(await $fooPath.exists()).toBe(true)
    })
  )
  it('should have a realPath equal to the file.', async () =>
    Path.withCwd($tempDir, async () => {
      const realPath = await $fooRelPath.realPath()
      expect(realPath).toBeEquals($fooPath)
    })
  )
})

describe('A dot dir in a cwd scope', () => {
  let $tempDir
  let $currentDir
  beforeEach(async () => { 
    $tempDir = await Path.createTempDir() 
    $currentDir = Path.current
  })
  afterEach(() => $tempDir.remove())

  it('should be a relative path.', () => {
    expect($currentDir.isRelative).toBe(true)
    expect($currentDir.isAbsolute).toBe(false)
  })
  it('should be a directory.', async () => 
    Path.withCwd($tempDir, async () => {
      expect(await $currentDir.exists()).toBe(true)
      expect(await $currentDir.isDirectory()).toBe(true)
    })
  )
  it('should resolve to be the temp directory.', async () =>
    Path.withCwd($tempDir, async () => {
      expect(await $currentDir.resolve()).toBeEquals($tempDir)
    })
  )
  it('should have a realpath equal to the temp directory.', async () =>
    Path.withCwd($tempDir, async () => {
      const realPath = await $currentDir.realPath()
      expect(realPath).toBeEquals($tempDir)
    })
  )
  it('can be used to list files in the current directory.', async () =>
    Path.withCwd($tempDir, async () => {
      await $tempDir('foo').touch()
      const files = await $currentDir.list()
      expect(files[0].isRelative).toBe(true) 

      const names = await $currentDir.list($ => $.name)
      expect(names.length).toBe(1)
      expect(names[0]).toBe('foo')
    })
  )
  it('can be used to make and remove a subdirectory.', async () =>
    Path.withCwd($tempDir, async () => {
      const relSubDir = await $currentDir('foo').make()
      expect(relSubDir.isRelative).toBe(true)
      expect(await relSubDir.exists()).toBe(true)
      expect(await relSubDir.isDirectory()).toBe(true)

      const subDir = $tempDir('foo')
      expect(subDir.isAbsolute).toBe(true)
      expect(await subDir.exists()).toBe(true)
      expect(await subDir.isDirectory()).toBe(true)

      await relSubDir.remove()
      expect(await relSubDir.exists()).toBe(false)
      expect(await subDir.exists()).toBe(false)
    })
  )
  it('can be used to make a symlink and reflect on its value.', async () =>
    Path.withCwd($tempDir, async () => {
      const relValue = Path.current('foo')
      const relLink = await $currentDir('my-link').symlink(relValue)
      const link = $tempDir('my-link')

      expect(!relLink.isAbsolute).toBe(true)
      expect(await relLink.exists()).toBe(false)
      expect(await relLink.isLink()).toBe(true)
      expect(await relLink.readLink()).toBeEquals(relValue)

      expect(link.isAbsolute).toBe(true)
      expect(await link.exists()).toBe(false)
      expect(await link.isLink()).toBe(true)
      expect(await link.readLink()).toBeEquals(relValue)
    })
  )
})
