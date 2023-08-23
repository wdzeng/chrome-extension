import { generateJwtToken, updatePackage } from '@/chrome-store-utils'

function requireEnvironmentVariable(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is required.`)
  }
  return value
}

async function main(): Promise<void> {
  const clientId = requireEnvironmentVariable('TEST_CLIENT_ID')
  const clientSecret = requireEnvironmentVariable('TEST_CLIENT_SECRET')
  const refreshToken = requireEnvironmentVariable('TEST_REFRESH_TOKEN')
  const extensionId = requireEnvironmentVariable('TEST_EXTENSION_ID')
  const zipPath = 'test/test-extension.zip'

  const jwtToken = await generateJwtToken(clientId, clientSecret, refreshToken)
  const success = await updatePackage(extensionId, zipPath, jwtToken)
  process.exit(success ? 0 : 1)
}

void main()
