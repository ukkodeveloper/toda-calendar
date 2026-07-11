"use client"

import { useState } from "react"

import { caseApi } from "@/lib/api"

import { Button } from "@astryxdesign/core/Button"
import { type ISODateString } from "@astryxdesign/core/Calendar"
import { DateInput } from "@astryxdesign/core/DateInput"
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog"
import { HStack, Layout, LayoutFooter, VStack } from "@astryxdesign/core/Layout"
import { TextArea } from "@astryxdesign/core/TextArea"
import { TextInput } from "@astryxdesign/core/TextInput"

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  roomId: number
  onDeclared?: (caseId: number, title: string) => void
}

export function DeclareCaseDialog({
  isOpen,
  onOpenChange,
  roomId,
  onDeclared,
}: Props) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [deadline, setDeadline] = useState<ISODateString | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const today = new Date().toISOString().split("T")[0] as ISODateString
  const canSubmit = title.trim().length > 0 && deadline != null

  const reset = () => {
    setTitle("")
    setContent("")
    setDeadline(undefined)
  }

  const handleCancel = () => {
    onOpenChange(false)
    reset()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      // 시작일=공표 시각, 마감일=선택한 이행 기간. "기간"=둘 사이(계약 CreateCaseRequest).
      const data = await caseApi.declare(roomId, {
        title: title.trim(),
        // 계약상 content 는 필수(min 1) — 비면 제목으로 대체.
        content: content.trim() || title.trim(),
        startDate: new Date().toISOString(),
        deadline: deadline + "T00:00:00",
      })
      onDeclared?.(data.caseId, title.trim())
      onOpenChange(false)
      reset()
    } catch {
      // TODO: 토스트 에러 처리
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={handleCancel}
      purpose="form"
      width={480}
    >
      <Layout
        padding={4}
        header={
          <DialogHeader
            title="공표하기"
            subtitle="어떤 결심을 걸 건가요?"
            onOpenChange={handleCancel}
          />
        }
        content={
          <VStack gap={4} style={{ padding: "var(--spacing-4, 16px)" }}>
            <TextInput
              label="제목"
              value={title}
              onChange={setTitle}
              placeholder="야식 금지"
              isRequired
            />
            <TextArea
              label="내용"
              value={content}
              onChange={setContent}
              placeholder="공약 세부 내용을 적어주세요 (예: 밤 9시 이후 금식)"
              rows={3}
              isOptional
            />
            <DateInput
              label="이행 기간"
              value={deadline}
              onChange={setDeadline}
              min={today}
              isRequired
            />
          </VStack>
        }
        footer={
          <LayoutFooter hasDivider padding={3}>
            <HStack gap={2} justify="end">
              <Button
                label="취소"
                variant="ghost"
                size="lg"
                onClick={handleCancel}
              />
              <Button
                label="공표하기"
                variant="primary"
                size="lg"
                isDisabled={!canSubmit}
                isLoading={isSubmitting}
                onClick={handleSubmit}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  )
}
