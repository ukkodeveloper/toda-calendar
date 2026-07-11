"use client"

import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Menu — 프로스티드(유리질감) 드롭다운. Base UI Menu(headless) 위(규칙5).
 * a11y·포커스·키보드·바깥클릭·portal 은 Base UI 가 내장. 우리는 표면만 입힌다.
 *
 * 표면: surface-glass + backdrop-blur + subtle 보더 + elevation-3 (무거운 보더 없이 떠 있는 느낌).
 * 모션: open/close 페이드 + 미세 scale, transform-origin 은 앵커 방향(Base UI 제공).
 *       reduce-motion 이면 즉시 전환(규칙11).
 *
 * 컴파운드:
 *   <Menu>
 *     <MenuTrigger render={<IconButton aria-label="추가"><Icon .../></IconButton>} />
 *     <MenuContent align="end">
 *       <MenuItem icon={...} description="...">생성하기</MenuItem>
 *       <MenuSeparator />
 *       <MenuItem>참여하기</MenuItem>
 *     </MenuContent>
 *   </Menu>
 */
const Menu = MenuPrimitive.Root
const MenuTrigger = MenuPrimitive.Trigger
const MenuGroup = MenuPrimitive.Group

type MenuContentProps = ComponentPropsWithoutRef<typeof MenuPrimitive.Popup> & {
  /** 앵커 대비 놓일 면. 기본 아래. */
  side?: "top" | "bottom" | "left" | "right"
  /** 면 기준 정렬. 헤더 우측 트리거는 end 가 자연스럽다. */
  align?: "start" | "center" | "end"
  /** 앵커와의 간격(px 토큰 배수). 기본 8. */
  sideOffset?: number
  ref?: Ref<HTMLDivElement>
}

function MenuContent({
  align = "end",
  className,
  ref,
  side = "bottom",
  sideOffset = 8,
  ...props
}: MenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        className="z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          ref={ref}
          data-slot="menu-content"
          style={{ transformOrigin: "var(--transform-origin)" }}
          className={cn(
            "min-w-64 rounded-panel border border-border-subtle bg-surface-glass p-1.5 text-text-primary shadow-elevation-3 backdrop-blur-xl outline-none",
            "transition-[opacity,transform,scale] duration-150 ease-out",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "motion-reduce:transition-none motion-reduce:data-[starting-style]:scale-100",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

type MenuItemProps = Omit<
  ComponentPropsWithoutRef<typeof MenuPrimitive.Item>,
  "children"
> & {
  /** 라벨 앞 leading 아이콘(장식). highlighted 면 primary 색으로 또렷해진다. */
  icon?: ReactNode
  /** 라벨 아래 보조 설명(2줄 항목). */
  description?: ReactNode
  children: ReactNode
  ref?: Ref<HTMLDivElement>
}

function MenuItem({
  children,
  className,
  description,
  icon,
  ref,
  ...props
}: MenuItemProps) {
  return (
    <MenuPrimitive.Item
      ref={ref}
      data-slot="menu-item"
      className={cn(
        "group/menu-item flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 py-2 text-text-primary transition-colors outline-none select-none",
        "data-[highlighted]:bg-surface-hover",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {icon ? (
        <span className="flex shrink-0 items-center text-text-tertiary group-data-[highlighted]/menu-item:text-text-primary">
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body font-strong">{children}</span>
        {description ? (
          <span className="truncate text-caption font-read text-text-tertiary">
            {description}
          </span>
        ) : null}
      </span>
    </MenuPrimitive.Item>
  )
}

/** MenuSeparator — 항목 그룹 구분선. Base UI Menu 엔 Separator 가 없어 표현용 div. */
function MenuSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      data-slot="menu-separator"
      className={cn("mx-1 my-1.5 h-px bg-border-subtle", className)}
      {...props}
    />
  )
}

function MenuGroupLabel({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof MenuPrimitive.GroupLabel> & {
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <MenuPrimitive.GroupLabel
      ref={ref}
      data-slot="menu-group-label"
      className={cn(
        "px-3 py-1.5 text-label font-strong text-text-tertiary",
        className
      )}
      {...props}
    />
  )
}

export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuGroup,
  MenuGroupLabel,
}
export type { MenuContentProps, MenuItemProps }
