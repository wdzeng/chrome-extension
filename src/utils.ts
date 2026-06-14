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

/**
 * Reads an environment variable and throws an error if it's not set.
 *
 * @param key the environment variable key
 * @returns the environment variable value
 */
export function requireEnvironmentVariable(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is required.`)
  }
  return value
}
