import { access, copyFile, mkdir } from "node:fs/promises"
import type { IncomingMessage, ServerResponse } from "node:http"
import { resolve } from "node:path"

import type { FastifyInstance } from "fastify"

import { buildApiApp } from "../apps/api/src/app.js"

const DEPLOYMENT_DATA_DIRECTORY = resolve("/tmp", "toda-calendar")
const DEPLOYMENT_DATA_FILE = resolve(DEPLOYMENT_DATA_DIRECTORY, "store.json")
const SEED_DATA_FILE = resolve(process.cwd(), "apps/api/.data/store.json")

let appPromise: Promise<FastifyInstance> | null = null

async function ensureDeploymentStore() {
  await mkdir(DEPLOYMENT_DATA_DIRECTORY, { recursive: true })

  try {
    await access(DEPLOYMENT_DATA_FILE)
  } catch {
    try {
      await copyFile(SEED_DATA_FILE, DEPLOYMENT_DATA_FILE)
    } catch {
      // Fall back to the API's default empty seed when no bundled seed file exists.
    }
  }
}

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      await ensureDeploymentStore()

      const { app } = await buildApiApp({
        env: {
          dataFilePath: DEPLOYMENT_DATA_FILE,
          host: "0.0.0.0",
          port: 0,
        },
        logger: false,
      })

      await app.ready()

      return app
    })()
  }

  return appPromise
}

function buildForwardedUrl(requestUrl: string | undefined) {
  const url = new URL(requestUrl ?? "/api", "https://toda-calendar.vercel.app")
  const route = url.searchParams.get("route")

  url.searchParams.delete("route")

  const pathname = route ? `/${route.replace(/^\/+/, "")}` : "/"
  const search = url.searchParams.toString()

  return search ? `${pathname}?${search}` : pathname
}

export async function handleTodaApiRequest(
  request: IncomingMessage,
  response: ServerResponse
) {
  const app = await getApp()

  request.url = buildForwardedUrl(request.url)
  app.server.emit("request", request, response)
}
