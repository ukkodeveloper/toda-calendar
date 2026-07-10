"use client"

import { Badge } from "@astryxdesign/core/Badge"
import { Dialog } from "@astryxdesign/core/Dialog"
import { Divider } from "@astryxdesign/core/Divider"
import { Heading } from "@astryxdesign/core/Heading"
import { Icon } from "@astryxdesign/core/Icon"
import { IconButton } from "@astryxdesign/core/IconButton"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { List, ListItem } from "@astryxdesign/core/List"
import { Text } from "@astryxdesign/core/Text"

type CaseStatus = "진행중" | "종결"

export type CaseItem = {
  id: string
  title: string
  description: string
  status: CaseStatus
}

// 임시 목 데이터 — 나중에 실데이터로 교체.
const MOCK_CASES: CaseItem[] = [
  {
    id: "c1",
    title: "아침 6시 기상 인증",
    description: "오늘 13분 지각 · 벌금 심의 중",
    status: "진행중",
  },
  {
    id: "c2",
    title: "주 3회 운동 인증",
    description: "이번 주 2/3 · 목요일까지",
    status: "진행중",
  },
  {
    id: "c3",
    title: "카페인 끊기",
    description: "3일 연속 성공 후 자백",
    status: "종결",
  },
]

export function CaseListDrawer({
  isOpen,
  onClose,
  cases = MOCK_CASES,
  onSelect,
}: {
  isOpen: boolean
  onClose: () => void
  cases?: CaseItem[]
  onSelect?: (c: CaseItem) => void
}) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      purpose="info"
      width={320}
      maxHeight="100dvh"
      padding={0}
      position={{ top: 0, right: 0, bottom: 0 }}
      className="case-drawer"
    >
      <VStack style={{ height: "100dvh", width: "100%" }}>
        <HStack
          align="center"
          justify="between"
          style={{ padding: "16px 16px 12px", flexShrink: 0 }}
        >
          <Heading level={4}>사건 목록</Heading>
          <IconButton
            label="닫기"
            variant="ghost"
            size="sm"
            icon={<Icon icon="close" size="md" />}
            onClick={onClose}
          />
        </HStack>
        <Divider />
        <VStack
          style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 8 }}
        >
          {cases.length === 0 ? (
            <VStack
              align="center"
              justify="center"
              style={{ flex: 1, gap: 4, padding: 32, textAlign: "center" }}
            >
              <Text color="secondary">아직 등록된 사건이 없어요</Text>
            </VStack>
          ) : (
            <List>
              {cases.map((c) => (
                <ListItem
                  key={c.id}
                  label={c.title}
                  description={c.description}
                  onClick={() => onSelect?.(c)}
                  endContent={
                    <Badge
                      variant={c.status === "진행중" ? "warning" : "neutral"}
                      label={c.status}
                    />
                  }
                />
              ))}
            </List>
          )}
        </VStack>
      </VStack>
    </Dialog>
  )
}
