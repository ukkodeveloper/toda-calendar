"use client"

import { useState } from "react"

import { Button } from "@astryxdesign/core/Button"
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog"
import { FileInput } from "@astryxdesign/core/FileInput"
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from "@astryxdesign/core/Layout"
import { Selector } from "@astryxdesign/core/Selector"
import { Text } from "@astryxdesign/core/Text"

import { optimizeEvidencePhoto } from "@/lib/image"

// 모바일 카메라가 찍는 포맷까지 폭넓게 허용. type 이 비는 HEIC 대비 확장자도 명시.
const PHOTO_ACCEPT = "image/*,.heic,.heif"

// 목 데이터 — 나중에 GET /api/rooms/{roomId}/cases?status=DECLARED 로 교체
const MOCK_DECLARED_CASES = [
  { caseId: "56", title: "매일 5km 달리기", nickname: "졸린 여우" },
  { caseId: "57", title: "커피 끊기", nickname: "성난 다람쥐" },
  { caseId: "58", title: "야식 금지", nickname: "배고픈 판다" },
]

interface WitnessDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function WitnessDialog({ isOpen, onClose }: WitnessDialogProps) {
  const [selectedCaseId, setSelectedCaseId] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit =
    selectedCaseId !== "" && photo !== null && !isProcessing && !isSubmitting

  // 증거사진은 한 장만. 선택 즉시 프론트에서 리사이즈·압축하고 HEIC 등은 JPEG 로 변환한다.
  const handlePhotoChange = async (f: File | File[] | null) => {
    const picked = Array.isArray(f) ? (f[0] ?? null) : f
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
      // 1) POST /api/photos — 사진 업로드
      // const { photoId } = await uploadPhoto(photo)
      // 2) POST /api/reports — 고발 등록
      // await submitReport({ caseId: selectedCaseId, photoId })
      console.log("고발 제출:", { caseId: selectedCaseId, photo: photo.name })
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      purpose="form"
      width={360}
    >
      <Layout
        header={
          <DialogHeader
            title="고발하기"
            subtitle="증거사진과 함께 목격한 사건을 고발하세요"
            onOpenChange={(open) => {
              if (!open) handleClose()
            }}
            hasDivider
          />
        }
        content={
          <LayoutContent>
            <VStack gap={5}>
              <Selector
                label="고발할 사건 선택"
                placeholder="사건을 선택하세요"
                value={selectedCaseId}
                onChange={setSelectedCaseId}
                options={MOCK_DECLARED_CASES.map((c) => ({
                  value: c.caseId,
                  label: `${c.title} · ${c.nickname}`,
                }))}
              />

              <VStack gap={2}>
                <FileInput
                  label="증거사진 (필수)"
                  value={photo}
                  onChange={handlePhotoChange}
                  accept={PHOTO_ACCEPT}
                  isDisabled={isProcessing}
                  isRequired
                />
                {isProcessing && (
                  <Text variant="footnote" color="secondary">
                    사진을 최적화하는 중…
                  </Text>
                )}
                {photoError && (
                  <Text variant="footnote" color="error">
                    {photoError}
                  </Text>
                )}
              </VStack>
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <HStack justify="end" gap={2}>
              <Button label="취소" variant="ghost" onClick={handleClose} />
              <Button
                label="고발하기"
                variant="primary"
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
