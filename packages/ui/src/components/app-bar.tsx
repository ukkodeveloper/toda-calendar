import { type Ref } from "react"

import {
  PageHeader,
  pageHeaderVariants,
  type PageHeaderProps,
} from "@workspace/ui/components/page-header"

/**
 * AppBar — PageHeader 의 하위호환 alias. (S4a 통합)
 *
 * AppBar 와 PageHeader 는 leading/title/subtitle/trailing + size 로 사실상 같은
 * 컴포넌트였다. 단일 구현(PageHeader)으로 합치되, 기존 소비처가 깨지지 않게
 * AppBar 이름·기본값(align="center")을 유지한다. 새 코드는 PageHeader 를 쓴다.
 */
type AppBarProps = Omit<PageHeaderProps, "meta"> & { ref?: Ref<HTMLElement> }

function AppBar({ align = "center", ...props }: AppBarProps) {
  return <PageHeader align={align} {...props} />
}

// 하위호환: 기존 소비처가 appBarVariants 를 import.
const appBarVariants = pageHeaderVariants

export { AppBar, appBarVariants }
export type { AppBarProps }
