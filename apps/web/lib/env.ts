function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

function isIpv4Host(hostname: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
}

export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()

  if (configured) {
    return trimTrailingSlash(configured)
  }

  if (typeof window === "undefined") {
    return ""
  }

  const { hostname, protocol } = window.location
  const normalizedProtocol = protocol === "https:" ? "https:" : "http:"

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${normalizedProtocol}//127.0.0.1:3030`
  }

  if (isIpv4Host(hostname)) {
    return `${normalizedProtocol}//${hostname}:3030`
  }

  return `${window.location.origin}/api`
}
