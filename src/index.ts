import * as core from '@actions/core'
import { AxiosError } from 'axios'

import { generateJwtToken, publishExtension, updatePackage } from './chrome-store-utils'

function getStringOrError(responseData: unknown): string | Error {
  if (typeof responseData === 'string' || responseData instanceof Error) {
    return responseData
  }
  return JSON.stringify(responseData)
}

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

function handleError(error: unknown): void {
  core.debug(JSON.stringify(error))

  // HTTP error.
  if (error instanceof AxiosError) {
    if (error.response) {
      // Got response from Web Store API server with status code 4XX or 5XX.
      core.setFailed(`Web Store API server responses with error code: ${error.response.status}`)
      core.setFailed(getStringOrError(error.response.data))
    }
    core.setFailed(error.message)
    return
  }

  // Unknown error.
  if (error instanceof Error) {
    core.setFailed('Unknown error occurred.')
    core.setFailed(error)
    return
  }

  // Unknown error type.
  core.setFailed('Unknown error occurred.')
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
  const zipPath = core.getInput('zip-path', { required: true })
  const testerOnly = core.getBooleanInput('tester-only')
  const uploadOnly = core.getBooleanInput('upload-only')

  try {
    await run(extensionId, zipPath, testerOnly, uploadOnly, clientId, clientSecret, refreshToken)
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
