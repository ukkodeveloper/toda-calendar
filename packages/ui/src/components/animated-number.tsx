"use client"

import * as React from "react"
import type { ComponentProps } from "react"

import { animate, motion, useReducedMotion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

type AnimatedNumberProps = {
  animationKey?: string | number
  duration?: number
  formatOptions?: Intl.NumberFormatOptions
  locale?: string
  respectReducedMotion?: boolean
  startValue?: number
  value: number | string
} & Omit<ComponentProps<"span">, "children">

const digitSequence = Array.from({ length: 20 }, (_, index) => index % 10)
const digitPattern = /\d/
const numericPattern = /[^0-9.-]/g

type NumericSpec = {
  finalText: string
  startText: string
  targetValue: number
  format: (value: number) => string
}

type DisplayPart =
  | { type: "static"; char: string; id: string }
  | { type: "digit"; digit: number; id: string }

function AnimatedNumber({
  "aria-label": ariaLabel,
  animationKey,
  className,
  duration = 1,
  formatOptions,
  locale = "ko-KR",
  respectReducedMotion = true,
  startValue = 0,
  value,
  ...props
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion()
  const numericSpec = React.useMemo(
    () => getNumericSpec({ formatOptions, locale, startValue, value }),
    [formatOptions, locale, startValue, value]
  )
  const [valueText, setValueText] = React.useState(numericSpec.startText)
  const lastValueTextRef = React.useRef(numericSpec.startText)
  const parts = React.useMemo(() => getDisplayParts(valueText), [valueText])
  const replayKey = animationKey ?? numericSpec.finalText
  const shouldReduceMotion = Boolean(reducedMotion && respectReducedMotion)

  React.useEffect(() => {
    function commit(nextText: string) {
      if (lastValueTextRef.current === nextText) {
        return
      }

      lastValueTextRef.current = nextText
      setValueText(nextText)
    }

    commit(numericSpec.startText)

    if (shouldReduceMotion) {
      commit(numericSpec.finalText)
      return
    }

    let playFrame = 0
    let controls: ReturnType<typeof animate> | undefined
    const startFrame = requestAnimationFrame(() => {
      playFrame = requestAnimationFrame(() => {
        controls = animate(startValue, numericSpec.targetValue, {
          duration,
          ease: motionTokens.ease.enter,
          onUpdate: (latestValue) => {
            commit(numericSpec.format(latestValue))
          },
          onComplete: () => {
            commit(numericSpec.finalText)
          },
        })
      })
    })

    return () => {
      cancelAnimationFrame(startFrame)
      cancelAnimationFrame(playFrame)
      controls?.stop()
    }
  }, [duration, numericSpec, replayKey, shouldReduceMotion, startValue])

  return (
    <span
      aria-label={ariaLabel ?? numericSpec.finalText}
      className={cn(
        "inline-flex items-baseline tabular-nums leading-none tracking-normal",
        className
      )}
      data-animated-number-current={valueText}
      data-animated-number-target={numericSpec.finalText}
      {...props}
    >
      <span aria-hidden="true" className="inline-flex items-baseline">
        {parts.map((part) => {
          if (part.type === "static") {
            return (
              <span key={part.id} className="whitespace-pre leading-none">
                {part.char}
              </span>
            )
          }

          return (
            <RollingDigit
              key={`${replayKey}-${part.id}`}
              digit={part.digit}
              reducedMotion={shouldReduceMotion}
            />
          )
        })}
      </span>
    </span>
  )
}

function getNumericSpec({
  formatOptions,
  locale,
  startValue,
  value,
}: {
  formatOptions?: Intl.NumberFormatOptions
  locale: string
  startValue: number
  value: number | string
}): NumericSpec {
  const rawValue = typeof value === "number" ? String(value) : value
  const normalizedValue = rawValue.replace(numericPattern, "")
  const parsedValue = Number(normalizedValue)
  const targetValue = Number.isFinite(parsedValue) ? parsedValue : 0
  const inferredFractionDigits =
    formatOptions?.maximumFractionDigits ??
    normalizedValue.match(/\.(\d+)/)?.[1]?.length ??
    0
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: inferredFractionDigits,
    maximumFractionDigits: inferredFractionDigits,
    ...formatOptions,
  })
  const format = (nextValue: number) => formatter.format(nextValue)

  return {
    finalText: format(targetValue),
    format,
    startText: format(startValue),
    targetValue,
  }
}

function getDisplayParts(valueText: string) {
  const [integerText, fractionText] = valueText.split(".")
  const integerChars = Array.from(integerText ?? "")
  const parts: DisplayPart[] = []

  integerChars.forEach((char, index) => {
    if (!digitPattern.test(char)) {
      parts.push({
        char,
        id: `integer-static-${index}-${char}`,
        type: "static",
      })
      return
    }

    const rightIndex = integerChars
      .slice(index + 1)
      .filter((candidate) => digitPattern.test(candidate)).length

    parts.push({
      digit: Number(char),
      id: `integer-digit-${rightIndex}`,
      type: "digit",
    })
  })

  if (fractionText !== undefined) {
    parts.push({ char: ".", id: "decimal-separator", type: "static" })

    Array.from(fractionText).forEach((char, index) => {
      if (!digitPattern.test(char)) {
        parts.push({
          char,
          id: `fraction-static-${index}-${char}`,
          type: "static",
        })
        return
      }

      parts.push({
        digit: Number(char),
        id: `fraction-digit-${index}`,
        type: "digit",
      })
    })
  }

  return parts
}

const RollingDigit = React.memo(function RollingDigit({
  digit,
  reducedMotion,
}: {
  digit: number
  reducedMotion: boolean
}) {
  if (reducedMotion) {
    return (
      <span className="inline-block w-[0.62em] text-center leading-none">
        {digit}
      </span>
    )
  }

  const finalIndex = 10 + digit

  return (
    <span
      className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-baseline leading-none [contain:paint]"
      data-animated-number-digit=""
    >
      <motion.span
        className="absolute top-0 left-0 flex origin-right flex-col will-change-transform transform-gpu"
        data-animated-number-reel=""
        initial={false}
        animate={{ y: `-${finalIndex}em` }}
        transition={{
          y: {
            duration: motionTokens.duration.quick,
            ease: motionTokens.ease.enter,
          },
        }}
      >
        {digitSequence.map((number, index) => (
          <span
            key={`${index}-${number}`}
            className="block h-[1em] w-[0.62em] text-center leading-none"
          >
            {number}
          </span>
        ))}
      </motion.span>
    </span>
  )
})

export { AnimatedNumber }
