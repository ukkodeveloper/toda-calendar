import type { Metadata } from "next"

import { DesignSystemDemo } from "./design-system-demo"

export const metadata: Metadata = {
  title: "디자인 시스템",
  description: "모바일 디자인 시스템 데모입니다.",
}

export default function DesignSystemPage() {
  return <DesignSystemDemo routeSegments={[]} />
}
