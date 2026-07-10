"use client"

import { Badge } from "@astryxdesign/core/Badge"
import { Button } from "@astryxdesign/core/Button"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { HStack, VStack } from "@astryxdesign/core/Layout"

export default function Home() {
  return (
    <VStack
      align="center"
      justify="between"
      minHeight="100dvh"
      style={{ maxWidth: 420, margin: "0 auto", padding: "56px 24px 40px" }}
    >
      <VStack align="center" style={{ gap: 20, textAlign: "center" }}>
        <Badge variant="error" label="6시간 해커톤 · The Court" />

        <VStack align="center" style={{ gap: 8 }}>
          <Heading level={1} type="display-1">
            현행범
          </Heading>
          <Text color="secondary">
            친구들의 고발과 재판으로, 내 결심을 진짜 지키게 만드는 소셜 커밋먼트
            앱
          </Text>
        </VStack>

        <HStack justify="center" style={{ gap: 8, flexWrap: "wrap" }}>
          <Badge variant="error" label="전과 2범" />
          <Badge variant="success" label="모범시민" />
          <Badge variant="neutral" label="배심원" />
        </HStack>
      </VStack>

      <VStack style={{ gap: 12, width: "100%" }}>
        <Button variant="primary" size="lg" label="채팅방 만들기" />
        <Button variant="secondary" size="lg" label="채팅방 참여하기" />
        <Text color="secondary" style={{ textAlign: "center", marginTop: 8 }}>
          디자인 시스템 @astryxdesign/core 연결됨
        </Text>
      </VStack>
    </VStack>
  )
}
