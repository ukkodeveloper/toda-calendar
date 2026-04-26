import { spawn } from "node:child_process"

const child = spawn("expo", ["export", "--platform", "web"], {
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
})

let sawExportComplete = false
let shutdownTimer = null
let outputTail = ""

function scheduleSuccessfulShutdown() {
  if (shutdownTimer) {
    return
  }

  shutdownTimer = setTimeout(() => {
    if (!child.killed) {
      child.kill("SIGTERM")
    }

    process.exit(0)
  }, 500)
}

function forwardOutput(stream, chunk) {
  const text = chunk.toString()
  stream.write(chunk)

  outputTail = `${outputTail}${text}`.slice(-200)

  if (outputTail.includes("Exported: dist")) {
    sawExportComplete = true
    scheduleSuccessfulShutdown()
  }
}

child.stdout.on("data", (chunk) => forwardOutput(process.stdout, chunk))
child.stderr.on("data", (chunk) => forwardOutput(process.stderr, chunk))

child.on("error", (error) => {
  console.error(error)
  process.exit(1)
})

child.on("exit", (code, signal) => {
  if (shutdownTimer) {
    clearTimeout(shutdownTimer)
  }

  if (sawExportComplete) {
    process.exit(0)
  }

  if (signal) {
    console.error(`expo export exited with signal ${signal}`)
    process.exit(1)
  }

  process.exit(code ?? 1)
})
