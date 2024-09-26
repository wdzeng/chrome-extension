import * as core from '@actions/core'

import { generateJwtToken, publishExtension, tryResolvePath, updatePackage } from './chrome-store-utils'
import { handleError } from './errors'

async function run(
  extensionId: string,
  zipPath: string,
  testerOnly: boolean,
  uploadOnly: boolean,
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<void> {
  core.info('Start to publish extension to Web Store.')

  let success: boolean

  const jwtToken = await generateJwtToken(clientId, clientSecret, refreshToken)
  success = await updatePackage(extensionId, zipPath, jwtToken)
  if (!success) {
    process.exit(1)
  }

  if (!uploadOnly) {
    // Do we need to publish the extension?
    success = await publishExtension(extensionId, testerOnly, jwtToken)
    if (!success) {
      process.exit(1)
    }
  }

  core.info('Extension published successfully.')
}

async function main(): Promise<void> {
  const clientId = core.getInput('client-id', { required: true })
  const clientSecret = core.getInput('client-secret', { required: true })
  const refreshToken = core.getInput('refresh-token', { required: true })

  const checkCredentialsOnly = core.getBooleanInput('check-credentials-only')
  if (checkCredentialsOnly) {
    try {
      await generateJwtToken(clientId, clientSecret, refreshToken)
    } catch (e: unknown) {
      handleError(e)
    }
    return
  }

  const extensionId = core.getInput('extension-id', { required: true })
  let zipPath = core.getInput('zip-path', { required: true })
  const testerOnly = core.getBooleanInput('tester-only')
  const uploadOnly = core.getBooleanInput('upload-only')

  try {
    zipPath = tryResolvePath(zipPath)
    await run(extensionId, zipPath, testerOnly, uploadOnly, clientId, clientSecret, refreshToken)
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
