import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DesignSystemDemo } from "../design-system-demo"

export const metadata: Metadata = {
  title: "Toda 디자인 시스템",
  description: "Toda Calendar의 모바일 디자인 시스템 데모입니다.",
}

type DesignSystemPageProps = {
  params: Promise<{
    slug: string[]
  }>
}

export default async function DesignSystemPage({
  params,
}: DesignSystemPageProps) {
  const { slug } = await params

  if (slug.join("/") === "examples/mobile-reference-screens") {
    redirect("/design-system/examples/social-dm")
  }

  return <DesignSystemDemo routeSegments={slug} />
}
