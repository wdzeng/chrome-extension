import * as core from '@actions/core'

import {
  generateJwtToken,
  publishExtension,
  tryResolvePath,
  updatePackage
} from '#/chrome-store-utils'

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
    throw new Error('Failed to update extension package.')
  }

  if (!uploadOnly) {
    // Do we need to publish the extension?
    success = await publishExtension(extensionId, testerOnly, jwtToken)
    if (!success) {
      throw new Error('Failed to publish extension.')
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
    await generateJwtToken(clientId, clientSecret, refreshToken)
    return
  }

  const extensionId = core.getInput('extension-id', { required: true })
  let zipPath = core.getInput('zip-path', { required: true })
  const testerOnly = core.getBooleanInput('tester-only')
  const uploadOnly = core.getBooleanInput('upload-only')

  zipPath = tryResolvePath(zipPath)
  await run(extensionId, zipPath, testerOnly, uploadOnly, clientId, clientSecret, refreshToken)
}

await main()
