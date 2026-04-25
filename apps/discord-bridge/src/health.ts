import fs from "node:fs"

export type BridgeHealthStatus = "starting" | "ready" | "stopping"

export type BridgeHealthSnapshot = {
  pid: number
  status: BridgeHealthStatus
  startedAt: string
  heartbeatAt: string
  readyAt?: string
  applicationId: string
  guildId: string
  sprintChannelId: string
}

export class BridgeHealthReporter {
  private readonly startedAt = new Date().toISOString()
  private interval?: NodeJS.Timeout
  private status: BridgeHealthStatus = "starting"
  private readyAt?: string

  constructor(
    private readonly filePath: string,
    private readonly metadata: {
      applicationId: string
      guildId: string
      sprintChannelId: string
    },
  ) {}

  private writeSnapshot() {
    const snapshot: BridgeHealthSnapshot = {
      pid: process.pid,
      status: this.status,
      startedAt: this.startedAt,
      heartbeatAt: new Date().toISOString(),
      readyAt: this.readyAt,
      applicationId: this.metadata.applicationId,
      guildId: this.metadata.guildId,
      sprintChannelId: this.metadata.sprintChannelId,
    }

    fs.writeFileSync(this.filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8")
  }

  start() {
    this.writeSnapshot()
    this.interval = setInterval(() => {
      this.writeSnapshot()
    }, 10_000)
    this.interval.unref()
  }

  markReady() {
    this.status = "ready"
    this.readyAt = new Date().toISOString()
    this.writeSnapshot()
  }

  stop() {
    this.status = "stopping"
    this.writeSnapshot()

    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
