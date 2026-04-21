import { buildApiApp } from "./app.js"

const { app, env } = await buildApiApp()

try {
  await app.listen({
    host: env.host,
    port: env.port,
  })
} catch (error) {
  app.log.error(error)
  process.exitCode = 1

  await app.close()
}
