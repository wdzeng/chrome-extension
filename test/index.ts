import child_process from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as core from '@actions/core'
import { AxiosError } from 'axios'

import { generateJwtToken, publishExtension, updatePackage } from '@/chrome-store-utils'
import { handleError } from '@/errors'

function requireEnvironmentVariable(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is required.`)
  }
  return value
}

function buildPackageZip(): string {
  let now = Date.now()
  const v4 = now & 0xffff
  now >>= 16
  const v3 = now & 0xffff
  now >>= 16
  const v2 = now & 0xffff
  now >>= 16
  const v1 = now & 0xffff

  // eslint-disable-next-line prettier/prettier
  const version = `${v1}.${v2}.${v3}.${v4}`
  core.info(`Package version: ${version}`)

  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const extDir = '/tmp/.test-extension'
  fs.rmSync(extDir, { recursive: true, force: true })
  fs.cpSync(path.join(testDir, 'test-extension'), extDir, { recursive: true })
  const manifestPath = path.join(extDir, 'manifest.json')
  // @ts-expect-error: JSON.parse accepts buffer
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const manifest: { version: string } = JSON.parse(fs.readFileSync(manifestPath))
  manifest.version = version
  fs.writeFileSync(manifestPath, JSON.stringify(manifest))

  const zipPath = `${extDir}.zip`
  fs.rmSync(zipPath, { force: true })
  child_process.execSync(`zip -r ${zipPath} *`, { cwd: extDir })
  core.info(`Build extension zip: ${zipPath}`)

  return zipPath
}

async function main(): Promise<void> {
  const clientId = requireEnvironmentVariable('TEST_CLIENT_ID')
  const clientSecret = requireEnvironmentVariable('TEST_CLIENT_SECRET')
  const refreshToken = requireEnvironmentVariable('TEST_REFRESH_TOKEN')
  const extensionId = requireEnvironmentVariable('TEST_EXTENSION_ID')
  const zipPath = buildPackageZip()

  try {
    const jwtToken = await generateJwtToken(clientId, clientSecret, refreshToken)
    let success = await updatePackage(extensionId, zipPath, jwtToken)
    if (!success) {
      process.exit(1)
    }
    // If the extension is under reviewing, the publish request will fail. The API does not tell the
    // error message type, so the following validation is based on the current behavior we observed
    // on 20240312.
    try {
      success = await publishExtension(extensionId, true, jwtToken)
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const errMessage: unknown = e.response?.data?.error?.message?.trim()
        if (
          errMessage ===
          'Publish condition not met: You may not edit or publish an item that is in review.'
        ) {
          core.info('The extension is under review so the publish request is rejected. This is OK.')
          process.exit(0)
        }
      }
      throw e
    }
    process.exit(success ? 0 : 1)
  } catch (e: unknown) {
    handleError(e)
    process.exit(2)
  }
}

void main()
