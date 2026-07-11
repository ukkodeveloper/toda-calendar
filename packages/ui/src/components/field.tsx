"use client"

import { type ComponentPropsWithoutRef, type Ref } from "react"

import { Field as FieldPrimitive } from "@base-ui/react/field"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Field — 폼 컨트롤 한 칸의 a11y 골격. Base UI Field(headless) 위(규칙5).
 * label↔control 연결·에러 aria·validity 는 Base UI 가 보장한다. 우리는 표면만 입힌다.
 *
 * 컴파운드:
 *   <Field>
 *     <FieldLabel>제목</FieldLabel>
 *     <Input value=… onChange=… />          // Base UI Field 에 자동 등록
 *     <FieldDescription>…</FieldDescription>
 *     <FieldError>…</FieldError>
 *   </Field>
 * 색·타이포는 semantic 토큰만(규칙1·2·3).
 */
function Field({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof FieldPrimitive.Root> & {
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <FieldPrimitive.Root
      ref={ref}
      data-slot="field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof FieldPrimitive.Label> & {
  ref?: Ref<HTMLLabelElement>
}) {
  return (
    <FieldPrimitive.Label
      ref={ref}
      data-slot="field-label"
      className={cn("text-caption font-strong text-text-secondary", className)}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof FieldPrimitive.Description> & {
  ref?: Ref<HTMLParagraphElement>
}) {
  return (
    <FieldPrimitive.Description
      ref={ref}
      data-slot="field-description"
      className={cn("text-label font-emphasis text-text-tertiary", className)}
      {...props}
    />
  )
}

function FieldError({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof FieldPrimitive.Error> & {
  ref?: Ref<HTMLParagraphElement>
}) {
  return (
    <FieldPrimitive.Error
      ref={ref}
      data-slot="field-error"
      className={cn("text-label font-emphasis text-fill-danger", className)}
      {...props}
    />
  )
}

export { Field, FieldLabel, FieldDescription, FieldError }
