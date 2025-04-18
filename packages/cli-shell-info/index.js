export class CliShellInfo {
  static default = new CliShellInfo()

  #name
  #getArgsFn

  constructor(name = false, getArgsFn = (cmd, args) => [cmd, ...args]) {
    this.#name = name
    this.#getArgsFn = getArgsFn
  }

  get name() { return this.#name }
  getArgs(cmd, args) { return this.#getArgsFn(cmd, args) }
}

// bash shell: e.g. bash -c 'echo hello'
export class CliBashShellInfo extends CliShellInfo {
  constructor() { super('bash') }
}

// cmd.exe shell: e.g. cmd "echo hello"
export class CliCmdShell extends CliShellInfo {
  constructor() { super('cmd') }
}

// ps shell: e.g. Get-Items
export class CliPsShellInfo extends CliShellInfo {
  constructor() { 
    super('cmd', (cmd, args) => ['powershell', '-Command', cmd, ...args]) 
  }
}

// wsl shell: e.g. wsl echo hello
export class CliWslShellInfo extends CliShellInfo {
  constructor() { 
    super('cmd', (cmd, args) => ['wsl', cmd, ...args]) 
  }
}

// sh shell: e.g. /bin/sh -c 'echo hello'
export class CliShShellInfo extends CliShellInfo {
  constructor() { 
    super('/bin/sh', (cmd, args) => [cmd, ...args]) 
  }
}