import * as core from '@actions/core'

import { publishExtension, uploadExtension } from '#/chrome-web-store/utils'
import { handleError } from '#/errors'
import { generateJwtToken } from '#/oauth'
import { globFile } from '#/utils'

async function runCheckCredentialsAction(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<void> {
  await generateJwtToken(clientId, clientSecret, refreshToken)
  core.info('Credentials are valid.')
}

async function main(): Promise<void> {
  const clientId = core.getInput('client-id', { required: true })
  const clientSecret = core.getInput('client-secret', { required: true })
  const refreshToken = core.getInput('refresh-token', { required: true })
  const action = core.getInput('action', { required: true })

  try {
    switch (action) {
      case 'check-credentials':
        await runCheckCredentialsAction(clientId, clientSecret, refreshToken)
        return
      case 'upload':
      case 'publish':
        break
      default:
        throw new Error(
          `Invalid action: ${action}. Supported actions are: publish, upload, check-credentials.`
        )
    }

    const publisherId = core.getInput('publisher-id', { required: true })
    const extensionId = core.getInput('extension-id', { required: true })
    let zipPath = core.getInput('zip-path', { required: true })
    zipPath = globFile(zipPath)

    const jwtToken = await generateJwtToken(clientId, clientSecret, refreshToken)
    await uploadExtension(publisherId, extensionId, zipPath, jwtToken)

    if (action === 'publish') {
      await publishExtension(publisherId, extensionId, jwtToken)
    }
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
