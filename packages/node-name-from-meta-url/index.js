import { readPackageUp } from 'read-pkg-up'
import { fileURLToPath } from 'url'
import { NodeName } from '@kingjs/node-name'

export async function nodeNameFromMetaUrl(url) {
  if (!url)
    return null

  // Get the file where the class is defined
  const classFile = fileURLToPath(url)

  // Locate the nearest package.json
  const packageInfo = await readPackageUp({ cwd: classFile })
  if (!packageInfo) {
    throw new Error("Could not find package.json for module.")
  }

  const { packageJson } = packageInfo
  
  // Use the package name directly
  return NodeName.from(packageJson.name)
}
