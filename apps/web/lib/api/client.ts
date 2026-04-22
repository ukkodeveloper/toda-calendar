"use client"

import {
  apiErrorSchema,
  getDayRecordResponseSchema,
  listDayRecordsResponseSchema,
  meResponseSchema,
  patchDayRecordBodySchema,
  type PatchDayRecordBody,
} from "@workspace/contracts"
import { z } from "zod"

import { getApiBaseUrl } from "../env"

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number
  ) {
    super(message)
    this.name = "ApiClientError"
  }
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> {
  const apiBaseUrl = getApiBaseUrl()

  if (!apiBaseUrl) {
    throw new ApiClientError(
      "API base URL is missing. Set NEXT_PUBLIC_API_BASE_URL for deployed environments."
    )
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const raw = await response.json().catch(() => null)
    const parsed = apiErrorSchema.safeParse(raw)

    if (parsed.success) {
      throw new ApiClientError(
        parsed.data.error.message,
        parsed.data.error.code,
        response.status
      )
    }

    throw new ApiClientError(`API request failed with status ${response.status}`)
  }

  return schema.parse(await response.json())
}

export function getMe() {
  return request("/v1/me", meResponseSchema)
}

export function listMonthDayRecords(calendarId: string, month: string) {
  return request(
    `/v1/calendars/${calendarId}/day-records?month=${encodeURIComponent(month)}`,
    listDayRecordsResponseSchema
  )
}

export async function patchDayRecord(
  calendarId: string,
  localDate: string,
  patch: PatchDayRecordBody
) {
  return request(
    `/v1/calendars/${calendarId}/day-records/${localDate}`,
    getDayRecordResponseSchema,
    {
      body: JSON.stringify(patchDayRecordBodySchema.parse(patch)),
      method: "PATCH",
    }
  )
}
