import YAML from 'yaml'
import { CliOutputService } from './index.js'

export default class CliOutputYamlService extends CliOutputService {
  static { this.initialize(import.meta) }

  constructor(options = { }) {
    if (CliOutputYamlService.initializing(new.target))
      return super()

    super(options)
  }

  async write(pojo) { 
    this.writeObject(pojo, o => YAML.stringify(o)) 
  }
}

// CliOutputYamlService.__dumpMetadata()
