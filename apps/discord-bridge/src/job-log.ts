import fs from "node:fs"
import path from "node:path"

type JobEvent = {
  at: string
  threadId: string
  sprintKey: string
  stage: string
  kind: string
  detail?: string
}

export class JobLogger {
  constructor(private readonly filePath: string) {}

  append(event: JobEvent) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true })
    fs.appendFileSync(this.filePath, `${JSON.stringify(event)}\n`, "utf8")
  }
}
