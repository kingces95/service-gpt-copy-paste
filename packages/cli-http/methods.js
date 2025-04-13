import { CliHttp } from '@kingjs/cli-http'

export class CliHttpGet extends CliHttp {
  static description = 'Perform an http GET request'
  static { this.initialize(import.meta) }

  constructor(url, options = { }) {
    if (CliHttpGet.initializing(new.target, options))
      return super()
    super(url, { method: 'GET', ...options })
  }
}

export class CliHttpPost extends CliHttp {
  static description = 'Perform an http POST request'
  static { this.initialize(import.meta) }

  constructor(url, options = { }) {
    if (CliHttpPost.initializing(new.target, options))
      return super()
    super(url, { method: 'POST', ...options })
  }
}

export class CliHttpPut extends CliHttp {
  static description = 'Perform an http PUT request'
  static { this.initialize(import.meta) }

  constructor(url, options = { }) {
    if (CliHttpPut.initializing(new.target, options))
      return super()
    super(url, { method: 'PUT', ...options })
  }
}

export class CliHttpDelete extends CliHttp {
  static description = 'Perform an http DELETE request'
  static { this.initialize(import.meta) }

  constructor(url, options = { }) {
    if (CliHttpDelete.initializing(new.target, options))
      return super()
    super(url, { method: 'DELETE', ...options })
  }
}

export class CliHttpPatch extends CliHttp {
  static description = 'Perform an http PATCH request'
  static { this.initialize(import.meta) }

  constructor(url, options = { }) {
    if (CliHttpPatch.initializing(new.target, options))
      return super()
    super(url, { method: 'PATCH', ...options })
  }
}

export class CliHttpHead extends CliHttp {
  static description = 'Perform an http HEAD request'
  static { this.initialize(import.meta) }

  constructor(url, options = { }) {
    if (CliHttpHead.initializing(new.target, options))
      return super()
    super(url, { method: 'HEAD', ...options })
  }
}

// CliHttpGet.__dumpMetadata(import.meta)
