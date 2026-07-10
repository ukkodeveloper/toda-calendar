"use client"

import { useState } from "react"

import { Icon } from "@astryxdesign/core/Icon"
import { IconButton } from "@astryxdesign/core/IconButton"
import { VStack } from "@astryxdesign/core/Layout"
import { Avatar } from "@astryxdesign/core/Avatar"
import {
  ChatComposer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatMessageMetadata,
  ChatSystemMessage,
} from "@astryxdesign/core/Chat"

import { AppHeader } from "@/components/app-header"
import { colorAvatarSrc } from "@/lib/avatar"

type Sender = "user" | "assistant" | "system"

type Message = {
  id: string
  sender: Sender
  name?: string
  color?: string
  text: string
  time: string
}

// 임시 목 데이터 — 나중에 실데이터로 교체.
const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "assistant",
    name: "김배심",
    color: "#4F9DFF",
    text: "오늘 아침 6시 기상 인증 아직 안 올라왔는데요?",
    time: "오전 6:12",
  },
  {
    id: "2",
    sender: "user",
    text: "지금 일어났습니다… 인증샷 바로 올릴게요",
    time: "오전 6:13",
  },
  {
    id: "3",
    sender: "assistant",
    name: "박검사",
    color: "#FF6B4F",
    text: "13분 지각. 벌금 대상입니다. 이의 있으면 소명하세요.",
    time: "오전 6:13",
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [value, setValue] = useState("")

  const handleSubmit = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        sender: "user",
        text: trimmed,
        time: "지금",
      },
    ])
    setValue("")
  }

  return (
    <VStack
      height="100dvh"
      style={{
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <AppHeader
        endContent={
          <IconButton
            label="메뉴 열기"
            variant="ghost"
            icon={<Icon icon="menu" size="lg" />}
          />
        }
      />

      <ChatLayout
        composer={
          <ChatComposer
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            placeholder="메시지를 입력하세요"
          />
        }
      >
        <ChatMessageList>
          <ChatSystemMessage variant="divider">오늘</ChatSystemMessage>
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              sender={m.sender}
              name={m.name}
              avatar={
                m.sender === "assistant" ? (
                  <Avatar
                    name={m.name ?? ""}
                    src={m.color ? colorAvatarSrc(m.color) : undefined}
                    size="small"
                  />
                ) : undefined
              }
            >
              <ChatMessageBubble>{m.text}</ChatMessageBubble>
              <ChatMessageMetadata timestamp={m.time} />
            </ChatMessage>
          ))}
        </ChatMessageList>
      </ChatLayout>
    </VStack>
  )
}
