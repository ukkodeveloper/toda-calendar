import { prisma } from "./db.js"
import { forbidden } from "./errors.js"

// 인가 헬퍼 — WS(chat:send·join)·REST 공용. 신원(uuid)은 이미 확인된 상태에서
// "이 유저가 이 리소스에 접근할 자격(방 멤버십·사건 소속)"만 본다.

// 이 방의 멤버가 아니면 forbidden. 멤버십은 소유권의 대리 — 방을 못 열면 발신·조회 불가.
export async function assertMember(
  roomId: number,
  uuid: string
): Promise<void> {
  const member = await prisma.member.findUnique({
    where: { roomId_userUuid: { roomId, userUuid: uuid } },
    select: { roomId: true },
  })
  if (!member) throw forbidden("NOT_A_MEMBER", "이 방의 멤버가 아닙니다")
}

// 스레드 발언 시 사건이 그 방 소속인지 확인(교차-방 스레드 위조 차단).
export async function assertCaseInRoom(
  caseId: number,
  roomId: number
): Promise<void> {
  const found = await prisma.case.findUnique({
    where: { id: caseId },
    select: { roomId: true },
  })
  if (!found || found.roomId !== roomId) {
    throw forbidden("CASE_ROOM_MISMATCH", "해당 방의 사건이 아닙니다")
  }
}
