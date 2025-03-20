import { format } from 'fast-csv';
import { CliOutputService } from './index.js'

export default class CliOutputTsvService extends CliOutputService {
  static { this.initialize(); }

  constructor(options = { }) {
    if (CliOutputTsvService.initializing(new.target)) {
      return super();
    }
    super(options);
  }

  async write(pojo = { }) {
    const stream = format({ headers: false, delimiter: "\t" })
    stream.pipe(this.stdout)
    this.forEach(pojo, row => stream.write(row))
  }
}
