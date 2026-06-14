import fs from 'node:fs'

import * as core from '@actions/core'
import AdmZip from 'adm-zip'
import { AxiosError } from 'axios'
import tmp from 'tmp'

import { publishExtension, uploadExtension } from '#/chrome-web-store/utils'
import { generateJwtToken } from '#/oauth'
import { requireEnvironmentVariable } from '#/utils'

tmp.setGracefulCleanup()

const TEST_EXTENSION = `
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
`

function calculateVersion(): string {
  let now = Date.now()
  const v4 = now & 0xffff
  now >>= 16
  const v3 = now & 0xffff
  now >>= 16
  const v2 = now & 0xffff
  now >>= 16
  const v1 = now & 0xffff
  return `${v1}.${v2}.${v3}.${v4}`
}

function updateTestExtensionZip(zipPath: string) {
  const zip = new AdmZip(zipPath)
  const manifestEntry = zip.getEntry('manifest.json')
  if (!manifestEntry) {
    throw new Error('manifest.json not found in the extension zip.')
  }

  // @ts-expect-error: JSON.parse accepts buffer
  const manifest = JSON.parse(manifestEntry.getData()) as { version: string }
  const version = calculateVersion()
  manifest.version = version
  manifestEntry.setData(JSON.stringify(manifest))
  zip.writeZip()

  core.info(`Updated test extension version to ${version}`)
}

async function main() {
  const publisherId = requireEnvironmentVariable('TEST_PUBLISHER_ID')
  const clientId = requireEnvironmentVariable('TEST_CLIENT_ID')
  const clientSecret = requireEnvironmentVariable('TEST_CLIENT_SECRET')
  const refreshToken = requireEnvironmentVariable('TEST_REFRESH_TOKEN')
  const extensionId = requireEnvironmentVariable('TEST_EXTENSION_ID')

  const zipPath = `${tmp.fileSync().name}.zip`
  fs.writeFileSync(zipPath, TEST_EXTENSION, 'base64')
  updateTestExtensionZip(zipPath)

  const jwtToken = await generateJwtToken(clientId, clientSecret, refreshToken)
  await uploadExtension(publisherId, extensionId, zipPath, jwtToken)

  // If the extension is under reviewing, the publish request will fail. The API does not tell the
  // error message type, so the following validation is based on the current behavior we observed
  // on 20240312 using Chrome Web Store v1 API.
  try {
    await publishExtension(publisherId, extensionId, jwtToken)
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const errMessage: unknown = e.response?.data?.error?.message?.trim()
      if (
        errMessage ===
        'Publish condition not met: You may not edit or publish an item that is in review.'
      ) {
        core.info('The extension is under review so the publish request is rejected. This is OK.')
        return
      }
    }

    throw e
  }
}

await main()
