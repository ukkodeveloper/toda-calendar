"use client"

import { useState } from "react"

import { DetentSheet } from "@workspace/ui/components/detent-sheet"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

import { caseApi } from "@/lib/api"

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
  const [deadline, setDeadline] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const today = new Date().toISOString().split("T")[0]
  const canSubmit = title.trim().length > 0 && deadline !== ""

  const reset = () => {
    setTitle("")
    setContent("")
    setDeadline("")
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
    <DetentSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel()
      }}
      title="공표하기"
      description="어떤 결심을 걸 건가요?"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="default" onClick={handleCancel}>
            취소
          </Button>
          <Button
            variant="primary"
            size="default"
            loading={isSubmitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            공표하기
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <Field>
          <FieldLabel>제목</FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="야식 금지"
          />
        </Field>

        <Field>
          <FieldLabel>내용</FieldLabel>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="공약 세부 내용을 적어주세요 (예: 밤 9시 이후 금식)"
            rows={3}
          />
        </Field>

        <Field>
          <FieldLabel>이행 기간</FieldLabel>
          <Input
            type="date"
            value={deadline}
            min={today}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>
      </div>
    </DetentSheet>
  )
}
