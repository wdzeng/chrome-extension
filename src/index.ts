import * as core from '@actions/core'
import { AxiosError } from 'axios'

import {
  generateJwtToken,
  publishExtension,
  updatePackage,
} from './chrome-store-utils'

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

  const jwtToken = await generateJwtToken(clientId, clientSecret, refreshToken)
  await updatePackage(extensionId, zipPath, jwtToken)
  if (!uploadOnly) { // Do we need to publish the extension?
    await publishExtension(extensionId, testerOnly, jwtToken)
  }

  core.info('Extension published successfully.')
}

function handleError(error: unknown): void {
  core.debug(JSON.stringify(error))

  // HTTP error
  if (error instanceof AxiosError) {
    if (error.response) {
      // Got response from Web Store API server with status code 4XX or 5XX
      core.setFailed(
        'Web Store API server responses with error code: ' +
        error.response.status
      )
      core.setFailed(error.response.data)
    }
    core.setFailed(error.message)
    return
  }

  // Unknown error
  if (error instanceof Error) {
    core.setFailed('Unknown error occurred.')
    core.setFailed(error)
    return
  }

  // Unknown error type
  core.setFailed('Unknown error occurred.')
}

async function main(): Promise<void> {
  const extensionId = core.getInput('extension-id', { required: true })
  const zipPath = core.getInput('zip-path', { required: true })
  const testerOnly = core.getBooleanInput('tester-only')
  const uploadOnly = core.getBooleanInput('upload-only')
  const clientId = core.getInput('client-id', { required: true })
  const clientSecret = core.getInput('client-secret', { required: true })
  const refreshToken = core.getInput('refresh-token', { required: true })

  core.debug('Extension ID: ' + extensionId)
  core.debug('Zip file path: ' + zipPath)
  core.debug('Publish to testers only: ' + testerOnly)
  core.debug('Upload only (no publishing): ' + uploadOnly)
  core.debug('Client ID: ' + clientId)
  core.debug('Client secret: ' + clientSecret)
  core.debug('Refresh token: ' + refreshToken)

  try {
    await run(
      extensionId,
      zipPath,
      testerOnly,
      uploadOnly,
      clientId,
      clientSecret,
      refreshToken
    )
  } catch (e: unknown) {
    handleError(e)
  }
}

main()
