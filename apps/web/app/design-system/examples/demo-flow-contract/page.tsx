import demo from "./demo.json"

import { DemoExamplePage } from "@/features/design-system/demo-example-page"
import type { DemoExampleMetadata } from "@/features/design-system/demo-types"

export default function DemoFlowContractPage() {
  return <DemoExamplePage demo={demo as DemoExampleMetadata} />
}
