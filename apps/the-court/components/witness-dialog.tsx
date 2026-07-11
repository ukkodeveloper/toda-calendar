"use client"

import { useEffect, useState } from "react"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { FileField } from "@workspace/ui/components/file-field"
import { Select } from "@workspace/ui/components/select"
import { Text } from "@workspace/ui/components/text"

import { caseApi, trialApi } from "@/lib/api"
import { uploadPhoto } from "@/lib/api/photo"
import type { CaseSummary } from "@/lib/api/types"

import { optimizeEvidencePhoto } from "@/lib/image"

// 모바일 카메라가 찍는 포맷까지 폭넓게 허용. type 이 비는 HEIC 대비 확장자도 명시.
const PHOTO_ACCEPT = "image/*,.heic,.heif"

interface WitnessDialogProps {
  isOpen: boolean
  onClose: () => void
  roomId: number
  onReported?: (trialId: number, caseId: number) => void
}

export function WitnessDialog({
  isOpen,
  onClose,
  roomId,
  onReported,
}: WitnessDialogProps) {
  const [selectedCaseId, setSelectedCaseId] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [declaredCases, setDeclaredCases] = useState<CaseSummary[]>([])
  const [casesLoading, setCasesLoading] = useState(false)

  const canSubmit =
    selectedCaseId !== "" && photo !== null && !isProcessing && !isSubmitting

  useEffect(() => {
    if (!isOpen) return
    setCasesLoading(true)
    caseApi
      .list(roomId, "DECLARED")
      .then(setDeclaredCases)
      .catch(() => {})
      .finally(() => setCasesLoading(false))
  }, [isOpen, roomId])

  // 증거사진은 한 장만. 선택 즉시 프론트에서 리사이즈·압축하고 HEIC 등은 JPEG 로 변환한다.
  const handlePhotoChange = async (picked: File | null) => {
    if (!picked) {
      setPhoto(null)
      setPhotoError(null)
      return
    }
    setIsProcessing(true)
    setPhotoError(null)
    try {
      const { file } = await optimizeEvidencePhoto(picked)
      setPhoto(file)
    } catch {
      setPhoto(null)
      setPhotoError(
        "이 사진은 처리할 수 없어요. 다른 사진으로 다시 시도해 주세요."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setSelectedCaseId("")
    setPhoto(null)
    setPhotoError(null)
    setIsProcessing(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      const { photoId } = await uploadPhoto(photo!)
      const resp = await trialApi.report({
        caseId: Number(selectedCaseId),
        photoId,
      })
      onReported?.(resp.trialId, resp.caseId)
      handleClose()
    } catch {
      // TODO: 에러 토스트
    } finally {
      setIsSubmitting(false)
    }
  }

  const photoName = isProcessing
    ? "사진을 최적화하는 중…"
    : (photo?.name ?? null)

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="고발하기"
      description="증거사진과 함께 목격한 사건을 고발해요"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="lg" onClick={handleClose}>
            취소
          </Button>
          <Button
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            고발하기
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        <Field>
          <FieldLabel>고발할 사건 선택</FieldLabel>
          <Select
            value={selectedCaseId}
            onValueChange={setSelectedCaseId}
            disabled={casesLoading}
            placeholder={
              casesLoading ? "사건 목록 불러오는 중…" : "사건을 선택하세요"
            }
            options={declaredCases.map((c) => ({
              value: String(c.caseId),
              label: c.title + " · " + c.defendant.nickname,
            }))}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <FileField
            label="증거사진 (필수)"
            accept={PHOTO_ACCEPT}
            disabled={isProcessing}
            fileName={photoName}
            placeholder="사진 선택 또는 촬영"
            onChange={handlePhotoChange}
          />
          {photoError ? (
            <Text variant="label" tone="danger">
              {photoError}
            </Text>
          ) : null}
        </div>
      </div>
    </BottomSheet>
  )
}
