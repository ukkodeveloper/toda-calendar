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

import { MOCK_CASES } from "@/lib/mock-chat"
import type { CaseDetailResponse, CaseResponse } from "@/lib/api/types"

export type TrialStatus = "STATEMENT" | "VOTING" | "ENDED"

export type CaseItem = CaseDetailResponse

export function CaseListDrawer({
  isOpen,
  onClose,
  roomId,
  onSelect,
  highlightCaseId,
}: {
  isOpen: boolean
  onClose: () => void
  roomId: number
  onSelect?: (c: CaseDetailResponse) => void
  highlightCaseId?: number
}) {
  const cases: CaseResponse[] = MOCK_CASES
  const loading = false

  const handleSelect = (c: CaseResponse) => {
    onSelect?.(c as unknown as CaseDetailResponse)
  }

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
          {loading ? null : cases.length === 0 ? (
            <VStack
              align="center"
              justify="center"
              style={{ flex: 1, gap: 4, padding: 32, textAlign: "center" }}
            >
              <Text color="secondary">아직 등록된 사건이 없어요</Text>
            </VStack>
          ) : (
            <List>
              {cases.map((c) => {
                const badgeProps =
                  c.status === "DECLARED"
                    ? { variant: "info" as const, label: "공표됨" }
                    : c.status === "ON_TRIAL"
                      ? { variant: "warning" as const, label: "재판중" }
                      : { variant: "neutral" as const, label: "종결" }

                const description =
                  c.status === "DECLARED"
                    ? "공표됨 · 고발 대기 중"
                    : c.status === "ON_TRIAL"
                      ? "재판 진행 중"
                      : "선고 완료"

                const isHighlighted = c.caseId === highlightCaseId
                return (
                  <ListItem
                    key={c.caseId}
                    label={c.title}
                    description={description}
                    onClick={() => handleSelect(c)}
                    endContent={<Badge {...badgeProps} />}
                    style={
                      isHighlighted
                        ? {
                            background:
                              "var(--color-background-accent-subtle, rgba(220,202,4,0.12))",
                            borderRadius: "var(--radius-element, 8px)",
                          }
                        : undefined
                    }
                  />
                )
              })}
            </List>
          )}
        </VStack>
      </VStack>
    </Dialog>
  )
}
