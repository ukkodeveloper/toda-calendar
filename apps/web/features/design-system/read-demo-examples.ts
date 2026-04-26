import fs from "node:fs"
import path from "node:path"

import type { DemoExample, DemoExampleMetadata } from "./demo-types"

const examplesDir = path.join(process.cwd(), "app", "design-system", "examples")

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readExampleMetadata(exampleDir: string) {
  const metadataPath = path.join(examplesDir, exampleDir, "demo.json")

  if (!fs.existsSync(metadataPath)) {
    return null
  }

  const raw = fs.readFileSync(metadataPath, "utf8")
  const parsed = JSON.parse(raw) as unknown

  if (!isRecord(parsed) || typeof parsed.slug !== "string") {
    return null
  }

  return {
    ...(parsed as DemoExampleMetadata),
    slug: parsed.slug,
    href: `/design-system/examples/${parsed.slug}`,
  } satisfies DemoExample
}

export function getDemoExamples() {
  if (!fs.existsSync(examplesDir)) {
    return []
  }

  return fs
    .readdirSync(examplesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readExampleMetadata(entry.name))
    .filter((example): example is DemoExample => example !== null)
    .sort((left, right) => left.slug.localeCompare(right.slug))
}
