import { CliOutputService } from './index.js'
import util from 'util'

export default class CliOutputUtilService extends CliOutputService {
  static { this.initialize() }

  constructor(options = { }) {
    if (CliOutputUtilService.initializing(new.target))
      return super()

    super(options)
  }

  async write(pojo) {
    const options = { colors: this.color, depth: null }
    this.writeObject(pojo, o => util.inspect(o, options))
  }
}
