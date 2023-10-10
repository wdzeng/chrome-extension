import * as core from '@actions/core'
import { AxiosError } from 'axios'

function getStringOrError(responseData: unknown): string | Error {
  if (typeof responseData === 'string' || responseData instanceof Error) {
    return responseData
  }
  return JSON.stringify(responseData)
}

export function handleError(error: unknown): void {
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
