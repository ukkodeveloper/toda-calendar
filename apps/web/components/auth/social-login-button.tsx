import type { AppAuthProviderDefinition } from "@/lib/auth/providers"
import { appCopy } from "@/lib/copy"

type SocialLoginButtonProps = {
  authReady: boolean
  nextPath: string
  provider: AppAuthProviderDefinition
}

const providerStyles = {
  apple: {
    button: "text-foreground",
    mark: "text-foreground",
    meta: "text-muted-foreground",
  },
  google: {
    button: "text-foreground",
    mark: "text-[color:#2563eb]",
    meta: "text-muted-foreground",
  },
  kakao: {
    button: "text-foreground",
    mark: "text-slate-950",
    meta: "text-muted-foreground",
  },
} as const

export function SocialLoginButton({
  authReady,
  nextPath,
  provider,
}: SocialLoginButtonProps) {
  const styles = providerStyles[provider.id]
  const descriptionId = `social-provider-${provider.id}-description`
  const href = `/auth/sign-in/${provider.id}?next=${encodeURIComponent(nextPath)}`

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`flex size-9 shrink-0 items-center justify-center text-base font-semibold ${styles.mark}`}
      >
        {provider.mark}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.98rem] font-medium">
          {provider.actionLabel}
        </span>
        <span
          id={descriptionId}
          className={`mt-0.5 block text-xs leading-5 ${styles.meta}`}
        >
          {provider.description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="text-lg font-medium opacity-55"
      >
        {authReady
          ? appCopy.component.socialLoginButton.readyTrailingMark
          : appCopy.component.socialLoginButton.disabledTrailingMark}
      </span>
    </>
  )

  if (!authReady) {
    return (
      <button
        type="button"
        disabled
        aria-describedby={descriptionId}
        className={`flex min-h-14 w-full items-center gap-3 py-3 text-left opacity-55 ${styles.button}`}
      >
        {content}
      </button>
    )
  }

  return (
    <a
      href={href}
      aria-describedby={descriptionId}
      className={`flex min-h-14 w-full items-center gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/40 ${styles.button}`}
    >
      {content}
    </a>
  )
}
