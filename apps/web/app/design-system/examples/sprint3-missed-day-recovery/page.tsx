import demo from "./demo.json"
import { MissedDayRecoveryDemo } from "./sprint3-missed-day-recovery-demo"

import type { DemoExampleMetadata } from "@/features/design-system/demo-types"

export default function Sprint3MissedDayRecoveryPage() {
  return <MissedDayRecoveryDemo demo={demo as DemoExampleMetadata} />
}
