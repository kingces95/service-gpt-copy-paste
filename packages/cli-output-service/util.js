import { CliOutputService } from './index.js'
import util from 'util'

export default class CliOutputUtilService extends CliOutputService {
  static { this.initialize(import.meta) }

  constructor(options = { }) {
    if (CliOutputUtilService.initializing(new.target))
      return super()

    super(options)
  }

  async write(pojo) {
    this.writeObject(pojo, 
      (o, isTTY) => util.inspect(o, { colors: isTTY, depth: null }),)
  }
}
