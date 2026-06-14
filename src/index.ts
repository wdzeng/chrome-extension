import * as core from '@actions/core'

import { publishExtension, uploadExtension } from '#/chrome-web-store/utils'
import { generateJwtToken } from '#/oauth'
import { globFile } from '#/utils'

async function run(
  publisherId: string,
  extensionId: string,
  zipPath: string,
  uploadOnly: boolean,
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<void> {
  core.info('Start to publish extension to Web Store.')

  const jwtToken = await generateJwtToken(clientId, clientSecret, refreshToken)
  await uploadExtension(publisherId, extensionId, zipPath, jwtToken)

  if (!uploadOnly) {
    // Do we need to publish the extension?
    await publishExtension(publisherId, extensionId, jwtToken)
  }

  core.info(
    uploadOnly ? 'Extension upload completed successfully.' : 'Extension published successfully.'
  )
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

  const publisherId = core.getInput('publisher-id', { required: true })
  const extensionId = core.getInput('extension-id', { required: true })
  let zipPath = core.getInput('zip-path', { required: true })
  const uploadOnly = core.getBooleanInput('upload-only')

  zipPath = globFile(zipPath)
  await run(publisherId, extensionId, zipPath, uploadOnly, clientId, clientSecret, refreshToken)
}

await main()
