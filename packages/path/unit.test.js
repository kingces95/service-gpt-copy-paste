import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Path } from '@kingjs/path'
import { dirname, basename, extname, normalize, sep } from 'path'
import { fileURLToPath } from 'url'
import { after } from 'lodash'

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
      expect(path1()).toBe(path2())
    })
    it('should throw if given an invalid argument.', () => {
      expect(() => Path.create({}))
        .toThrow('Invalid Path.create argument. Must be a Path, string, or URL.')
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

describe('functor', () => {
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

describe('path foo/bar/baz.js', () => {
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
    expect(await $.isEmpty).toBe(true)
  })
  it('should not be a file, directory, or link.', async () => {
    expect(await $.isFile).toBe(false)
    expect(await $.isDirectory).toBe(false)
    expect(await $.isLink).toBe(false)
  })
  it('should not be readable, writable, or executable.', async () => {
    expect(await $.isReadable).toBe(false)
    expect(await $.isWritable).toBe(false)
    expect(await $.isExecutable).toBe(false)
  })

  // timestamps
  it('should return null for all dates.', async () => {
    expect(await $.modifiedDate).toBe(null)
    expect(await $.creationDate).toBe(null)
    expect(await $.accessDate).toBe(null)
    expect(await $.changeDate).toBe(null)
  })
  it('should return null for all times.', async () => {
    expect(await $.modifiedTime).toBe(null)
    expect(await $.creationTime).toBe(null)
    expect(await $.accessTime).toBe(null)
    expect(await $.changeTime).toBe(null)
  })

  // owners
  it('should return null for all owners.', async () => {
    expect(await $.ownerUserId).toBe(null)
    expect(await $.ownerGroupId).toBe(null)
  })

  // size
  it('should return null for size.', async () => {
    expect(await $.size).toBe(null)
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
    expect(await $.isEmpty).toBe(true)
  })
  it('should be a directory, not a file, or link.', async () => {
    expect(await $.isDirectory).toBe(true)
    expect(await $.isFile).toBe(false)
    expect(await $.isLink).toBe(false)
  })
  it('should be readable, writable, and executable.', async () => {
    expect(await $.isReadable).toBe(true)
    expect(await $.isWritable).toBe(true)
    expect(await $.isExecutable).toBe(true)
  })

  // date/time
  it('should return Date for all dates.', async () => {
    expect(await $.modifiedDate).toBeInstanceOf(Date)
    expect(await $.creationDate).toBeInstanceOf(Date)
    expect(await $.accessDate).toBeInstanceOf(Date)
    expect(await $.changeDate).toBeInstanceOf(Date)
  })
  it('should return number for all times.', async () => {
    expect(typeof await $.modifiedTime).toBe('number')
    expect(typeof await $.creationTime).toBe('number')
    expect(typeof await $.accessTime).toBe('number')
    expect(typeof await $.changeTime).toBe('number')
  })

  it('should be created before modified.', async () => {
    const ctime = await $.creationTime
    const mtime = await $.modifiedTime
    expect(ctime).toBeLessThanOrEqual(mtime)
  })
  it('should be accessed before modified.', async () => {
    const atime = await $.accessTime  
    const mtime = await $.modifiedTime
    expect(mtime).toBeLessThanOrEqual(atime)
  })
  it('should be created before changed.', async () => {
    const ctime = await $.creationTime
    const mtime = await $.changeTime  
    expect(ctime).toBeLessThanOrEqual(mtime)
  })

  // owners
  it('should return number for all owners.', async () => {
    expect(typeof await $.ownerUserId).toBe('number')
    expect(typeof await $.ownerGroupId).toBe('number')
  })

  // size
  it('should return zero for size.', async () => {
    expect(await $.size).toBe(0)
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
    expect(await $.isEmpty).toBe(false)
  })
  it('should be a file, not a directory or link.', async () => {
    expect(await $.isFile).toBe(true)
    expect(await $.isDirectory).toBe(false)
    expect(await $.isLink).toBe(false)
  })
  it('should be readable, writable, and executable.', async () => {
    expect(await $.isReadable).toBe(true)
    expect(await $.isWritable).toBe(true)
    expect(await $.isExecutable).toBe(true)
  })

  // date/time
  it('should return Date for all dates.', async () => {
    expect(await $.modifiedDate).toBeInstanceOf(Date)
    expect(await $.creationDate).toBeInstanceOf(Date)
    expect(await $.accessDate).toBeInstanceOf(Date)
    expect(await $.changeDate).toBeInstanceOf(Date)
  })
  it('should return number for all times.', async () => {
    expect(typeof await $.modifiedTime).toBe('number')
    expect(typeof await $.creationTime).toBe('number')
    expect(typeof await $.accessTime).toBe('number')
    expect(typeof await $.changeTime).toBe('number')
  })

  it('should be created before modified.', async () => {
    const ctime = await $.creationTime
    const mtime = await $.modifiedTime
    expect(ctime).toBeLessThanOrEqual(mtime)
  })
  it('should be accessed before modified.', async () => {
    const atime = await $.accessTime  
    const mtime = await $.modifiedTime
    expect(mtime).toBeLessThanOrEqual(atime)
  })
  it('should be created before changed.', async () => {
    const ctime = await $.creationTime
    const mtime = await $.changeTime  
    expect(ctime).toBeLessThanOrEqual(mtime)
  })

  // owners
  it('should return number for all owners.', async () => {
    expect(typeof await $.ownerUserId).toBe('number')
    expect(typeof await $.ownerGroupId).toBe('number')
  })

  // size
  it('should return a non-zero size.', async () => {
    expect(await $.size).toBeGreaterThan(0)
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
    expect(await $.isDirectory).toBe(true)
  })
  it('should not throw on remove or dispose.', async () => {
    await $.remove()
    expect(await $.exists()).toBe(false)
    await $.dispose()
    expect(await $.exists()).toBe(false)
  })
  it('should be empty with size zero after touch.', async () => {
    await $.touch()
    expect(await $.isEmpty).toBe(true)
    expect(await $.size).toBe(0)
  })
  it('should be readable, writable, and executable after touch.', async () => {
    await $.touch()
    expect(await $.isReadable).toBe(true)
    expect(await $.isWritable).toBe(true)
    expect(await $.isExecutable).toBe(true)
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
    expect(await $.isDirectory).toBe(true)
  })
})

describe('temporary file', () => {
  let $
  beforeEach(async () => { $ = await Path.createTempFile() })
  afterEach(() => $.remove())

  it('should be readable, writable, and executable after touch.', async () => {
    expect(await $.isReadable).toBe(true)
    expect(await $.isWritable).toBe(true)
    expect(await $.isExecutable).toBe(true)
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
  it('should be moved after moveTo.', async () => {
    const target = Path.createTemp()
    await $.moveTo(target)
    expect(await $.exists()).toBe(false)
    expect(await target.exists()).toBe(true)
    await target.remove()
  })
  it('should be copied after copyTo.', async () => {
    const target = Path.createTemp()
    await $.copyTo(target)
    expect(await $.exists()).toBe(true)
    expect(await target.exists()).toBe(true)
    await target.remove()
  }),
  it('should be empty with size zero.', async () => {
    expect(await $.isEmpty).toBe(true)
    expect(await $.size).toBe(0)
  })
  it('should have content after write that can be read.', async () => {
    const content = 'foo'
    await $.write(content)
    expect(await $.read()).toBe(content)
    expect(await $.isEmpty).toBe(false)
    expect(await $.size).toBe(content.length)
  })
  it('should have content after appending twice that can be read.', async () => {
    const content = 'foo'
    await $.append(content)
    await $.append(content)
    expect(await $.read()).toBe(content + content)
    expect(await $.isEmpty).toBe(false)
    expect(await $.size).toBe(content.length * 2)
  })
  it('should be able to write and read json using json methods.', async () => {
    const content = { foo: 'bar' }
    await $.writeJson(content)
    expect(await $.readJson()).toEqual(content)
  })
})

describe('temporary directory', () => {
  let $
  beforeEach(async () => { $ = await Path.createTempDir() })
  afterEach(() => $.remove())

  it('should be readable, writable, and executable after make.', async () => {
    expect(await $.isReadable).toBe(true)
    expect(await $.isWritable).toBe(true)
    expect(await $.isExecutable).toBe(true)
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
  it('should be moved after moveTo.', async () => {
    const target = Path.createTemp()
    await $.moveTo(target)
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
