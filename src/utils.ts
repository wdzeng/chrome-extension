import { globSync } from 'glob'

/**
 * Globs the only found file.
 *
 * @param pattern glob pattern to find the file
 * @returns the only found file
 * @throws if no file is found or multiple files are found
 */
export function globFile(pattern: string): string {
  const foundFiles = globSync(pattern)

  if (foundFiles.length < 1) {
    throw new Error(`File not found: ${pattern}`)
  }
  if (foundFiles.length > 1) {
    throw new Error(`Multiple files found: ${pattern}`)
  }

  return foundFiles[0]!
}
