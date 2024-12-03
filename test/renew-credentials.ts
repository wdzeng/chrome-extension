import { generateJwtToken } from '@/chrome-store-utils'
import { handleError } from '@/errors'

function requireEnvironmentVariable(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is required.`)
  }
  return value
}

const clientId = requireEnvironmentVariable('TEST_CLIENT_ID')
const clientSecret = requireEnvironmentVariable('TEST_CLIENT_SECRET')
const refreshToken = requireEnvironmentVariable('TEST_REFRESH_TOKEN')

async function main(): Promise<void> {
  try {
  await generateJwtToken(clientId, clientSecret, refreshToken)
  } catch (error) {
    handleError(error)
  }
}

void main()
