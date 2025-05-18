import { Path } from '@kingjs/path'
import { Disposer } from '@kingjs/disposer'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

export class TempPath {
  static create({ extension = '', prefix = 'tmp-', suffix = '' } = {}) {
    const base = tmpdir()
    const name = `${prefix}${randomUUID()}${suffix}${extension}`
    return new Path()(base)(name)
  }

  static async createFile(options) {
    const path =this.create(options)
    await path.touch()
    return [path, new Disposer(() => path.remove({ force: true }))]
  }

  static async createDir(options) {
    const path = this.create(options)
    await path.make({ recursive: true })
    return [path, new Disposer(() => path.remove({ force: true }))]
  }
} 
