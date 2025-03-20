import { CliOutputService } from './index.js'

export default class CliOutputJsonService extends CliOutputService {
  static { this.initialize() }

  constructor(options = { }) {
    if (CliOutputJsonService.initializing(new.target))
      return super()

    super(options)
  }

  async write(pojo) { 
    this.writeObject(pojo, o => JSON.stringify(o, null, 2)) 
  }
}
