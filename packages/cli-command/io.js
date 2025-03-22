import { CliFdReadable } from '@kingjs/cli-fd/readable'
import { CliFdWritable } from '@kingjs/cli-fd/writable'

export class CliErr extends CliFdWritable { 
  static STDERR_FD = 2
  constructor() { 
    super({ fd: CliErr.STDERR_FD })
  }
}

export class CliOut extends CliFdWritable { 
  static STDOUT_FD = 1
  constructor() { 
    super({ fd: CliOut.STDOUT_FD }) 

    this.isTTY = process.stdout.isTTY
  }
}

export class CliIn extends CliFdReadable { 
  static STDIN_FD = 0
  constructor() { 
    super({ fd: CliIn.STDIN_FD }) 
  }
}
