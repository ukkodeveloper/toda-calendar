import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * DS 커스텀 텍스트 사이즈 토큰(text-display·title·body·input·caption·label)을
 * tailwind-merge 의 font-size 그룹으로 등록한다.
 *
 * 안 하면 twMerge 가 이 사이즈 유틸을 text-{color} 와 같은 text-* 로 착각해
 * 충돌로 병합 → 뒤에 온 하나만 남기고 색 유틸을 지운다.
 * (버그였음: outgoing 버블의 `text-text-on-fill`(흰색)이 `text-body`(사이즈)에 밀려 사라져
 *  글자가 상속색=검정으로 폴백.)
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "title", "body", "input", "caption", "label"] },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
