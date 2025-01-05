import { hideBin } from 'yargs/helpers'
import url from 'url'
import path from 'path'

export default class CliShell {

  static runIf(mainUrl, ctor) {
    if (url.fileURLToPath(mainUrl) === path.resolve(process.argv[1])) {
      CliShell.run({ '$0': ctor })
    }
  }

  static run(classes, args = hideBin(process.argv), namespace) {
    const loader = new CliLoader(args, namespace)

    for (const [name, node] of Object.entries(classes)) {
      loader.loadTree(name, node)
    }

    loader.run()
  }
}
