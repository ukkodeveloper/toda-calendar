import type { IncomingMessage, ServerResponse } from "node:http"

import { handleTodaApiRequest } from "./_toda-api.js"

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
) {
  await handleTodaApiRequest(request, response)
}
