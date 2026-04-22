import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer } from "node:http"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputDirectory = path.resolve(__dirname, "../out")
const port = Number(process.env.PORT ?? 3000)

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
}

function toSafePathname(requestUrl = "/") {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname)
  const normalizedPath = path.posix.normalize(pathname)

  if (normalizedPath.includes("..")) {
    return "/"
  }

  return normalizedPath
}

async function resolveAssetPath(requestUrl) {
  const safePathname = toSafePathname(requestUrl)
  const trimmedPathname = safePathname.replace(/^\/+/, "")
  const basePath = path.resolve(outputDirectory, trimmedPathname)
  const candidates = safePathname.endsWith("/")
    ? [path.join(basePath, "index.html")]
    : [basePath, `${basePath}.html`, path.join(basePath, "index.html")]

  for (const candidate of candidates) {
    try {
      const candidateStat = await stat(candidate)

      if (candidateStat.isFile()) {
        return candidate
      }
    } catch {
      continue
    }
  }

  return null
}

const server = createServer(async (request, response) => {
  const assetPath = await resolveAssetPath(request.url)

  if (!assetPath) {
    const notFoundPage = path.join(outputDirectory, "404.html")

    try {
      await stat(notFoundPage)
      response.writeHead(404, {
        "Content-Type": contentTypes[".html"],
      })
      createReadStream(notFoundPage).pipe(response)
      return
    } catch {
      response.writeHead(404, {
        "Content-Type": contentTypes[".txt"],
      })
      response.end("Not found")
      return
    }
  }

  const extension = path.extname(assetPath).toLowerCase()
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] ?? "application/octet-stream",
  })
  createReadStream(assetPath).pipe(response)
})

server.listen(port, () => {
  console.log(`Serving static export from ${outputDirectory} on http://localhost:${port}`)
})
