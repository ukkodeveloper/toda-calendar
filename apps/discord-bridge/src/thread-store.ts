import fs from "node:fs"
import path from "node:path"

import type { SprintThreadState, SprintThreadStoreShape } from "./types.js"

const emptyStore = (): SprintThreadStoreShape => ({
  threads: {},
})

export class ThreadStore {
  constructor(private readonly filePath: string) {}

  private ensureParentDir() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true })
  }

  private readStore(): SprintThreadStoreShape {
    this.ensureParentDir()

    if (!fs.existsSync(this.filePath)) {
      return emptyStore()
    }

    const raw = fs.readFileSync(this.filePath, "utf8")

    if (!raw.trim()) {
      return emptyStore()
    }

    return JSON.parse(raw) as SprintThreadStoreShape
  }

  private writeStore(store: SprintThreadStoreShape) {
    this.ensureParentDir()
    fs.writeFileSync(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8")
  }

  get(threadId: string) {
    return this.readStore().threads[threadId]
  }

  list() {
    return Object.values(this.readStore().threads)
  }

  findBySprintKey(sprintKey: string) {
    return this.list().find((thread) => thread.sprintKey === sprintKey)
  }

  listByBaseSprintKey(baseSprintKey: string) {
    return this.list().filter((thread) => (thread.baseSprintKey ?? thread.sprintKey) === baseSprintKey)
  }

  findLatestOpenByBaseSprintKey(baseSprintKey: string) {
    return this.listByBaseSprintKey(baseSprintKey)
      .filter((thread) => thread.status !== "DONE")
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
  }

  getNextRunNumber(baseSprintKey: string) {
    const runs = this.listByBaseSprintKey(baseSprintKey).map((thread) => thread.runNumber ?? 1)

    if (runs.length === 0) {
      return 1
    }

    return Math.max(...runs) + 1
  }

  upsert(thread: SprintThreadState) {
    const store = this.readStore()
    store.threads[thread.threadId] = thread
    this.writeStore(store)
    return thread
  }
}
