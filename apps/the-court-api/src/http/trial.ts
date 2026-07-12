import type {
  Participant,
  TrialEndResponse,
  TrialParticipantsResponse,
  TrialStatusResponse,
  VoteResponse,
  VoteResultResponse,
} from "@workspace/contracts"
import { voteRequestSchema } from "@workspace/contracts"
import type { Prisma, PrismaClient } from "@prisma/client"
import { Hono } from "hono"

import { type AppEnv, requireExistingUser, requireUser } from "../context.js"
import { createSystemMessage } from "../chat.js"
import { prisma } from "../db.js"
import {
  assertCanEndStatement,
  assertCanEndTrial,
  caseStatusAfterVerdict,
} from "../domain/state-transition.js"
import { computeVerdict } from "../domain/verdict.js"
import { conflict, forbidden, notFound } from "../errors.js"
import { remainingSecondsFrom } from "../mappers.js"
import {
  emitChatMessage,
  emitTrialStatus,
  emitVerdictRevealed,
  emitVoteUpdated,
} from "../ws/hub.js"

// 재판 — 참여자·투표·집계·최후진술 종료·선고. write=REST → 결과 WS broadcast.
export const trialRoutes = new Hono<AppEnv>()

type DbClient = PrismaClient | Prisma.TransactionClient

// 투표 집계 헬퍼 — guilty/notGuilty 표 수 + 방 인원 기준 totalVoters(피고 제외).
// client 를 받아 선고 tx 안에서도(verdict 확정과 원자) 같은 스냅샷으로 집계할 수 있게 한다.
async function tally(client: DbClient, trialId: number, roomId: number) {
  const [guiltyCount, notGuiltyCount, memberCount] = await Promise.all([
    client.vote.count({ where: { trialId, guilty: true } }),
    client.vote.count({ where: { trialId, guilty: false } }),
    client.member.count({ where: { roomId } }),
  ])
  return {
    guiltyCount,
    notGuiltyCount,
    votedCount: guiltyCount + notGuiltyCount,
    totalVoters: Math.max(0, memberCount - 1), // 피고 1명 제외
  }
}

// GET /api/trials/:trialId/participants — 현행범 + 목격자(피고 제외 방 멤버). ENDED 도 응답.
trialRoutes.get("/trials/:trialId/participants", async (c) => {
  const trialId = Number(c.req.param("trialId"))
  const trial = await prisma.trial.findUnique({
    where: { id: trialId },
    include: { case: true },
  })
  if (!trial) throw notFound("TRIAL_NOT_FOUND", "재판을 찾을 수 없습니다")

  const members = await prisma.member.findMany({
    where: { roomId: trial.case.roomId },
    include: { user: true },
  })
  const defendantUuid = trial.case.defendantUuid
  const defendantMember = members.find((m) => m.userUuid === defendantUuid)
  const defendant: Participant = {
    uuid: defendantUuid,
    nickname: defendantMember?.user.nickname ?? "?",
    isDefendant: true,
  }
  const witnesses: Participant[] = members
    .filter((m) => m.userUuid !== defendantUuid)
    .map((m) => ({
      uuid: m.userUuid,
      nickname: m.user.nickname,
      isDefendant: false,
    }))

  return c.json({
    trialId,
    caseId: trial.caseId,
    status: trial.status,
    defendant,
    witnesses,
    statementEndsAt: (trial.statementEndsAt ?? new Date()).toISOString(),
  } satisfies TrialParticipantsResponse)
})

// POST /api/trials/:trialId/votes — 투표(VOTING 단계만, 본인 불가) → vote:updated broadcast.
trialRoutes.post("/trials/:trialId/votes", async (c) => {
  const uuid = await requireExistingUser(c)
  const trialId = Number(c.req.param("trialId"))
  const body = voteRequestSchema.parse(await c.req.json())

  const trial = await prisma.trial.findUnique({
    where: { id: trialId },
    include: { case: true },
  })
  if (!trial) throw notFound("TRIAL_NOT_FOUND", "재판을 찾을 수 없습니다")
  if (trial.status !== "VOTING") {
    throw conflict("TRIAL_NOT_IN_VOTING", "평결(VOTING) 단계가 아닙니다")
  }
  if (trial.case.defendantUuid === uuid) {
    throw forbidden("DEFENDANT_CANNOT_VOTE", "현행범은 투표할 수 없습니다")
  }

  await prisma.vote.upsert({
    where: { trialId_voterUuid: { trialId, voterUuid: uuid } },
    create: { trialId, voterUuid: uuid, guilty: body.guilty },
    update: { guilty: body.guilty }, // 재투표 = 표 갱신(1인1표)
  })

  const counts = await tally(prisma, trialId, trial.case.roomId)
  emitVoteUpdated(trialId, { trialId, ...counts })

  return c.json(
    {
      trialId,
      guilty: body.guilty,
      votedCount: counts.votedCount,
      totalVoters: counts.totalVoters,
    } satisfies VoteResponse,
    201
  )
})

// GET /api/trials/:trialId/votes/result — 집계 + 본인 투표상태.
trialRoutes.get("/trials/:trialId/votes/result", async (c) => {
  const uuid = requireUser(c)
  const trialId = Number(c.req.param("trialId"))
  const trial = await prisma.trial.findUnique({
    where: { id: trialId },
    include: { case: true },
  })
  if (!trial) throw notFound("TRIAL_NOT_FOUND", "재판을 찾을 수 없습니다")

  const counts = await tally(prisma, trialId, trial.case.roomId)
  const myVote = await prisma.vote.findUnique({
    where: { trialId_voterUuid: { trialId, voterUuid: uuid } },
    select: { guilty: true },
  })

  return c.json({
    trialId,
    status: trial.status,
    guiltyCount: counts.guiltyCount,
    notGuiltyCount: counts.notGuiltyCount,
    votedCount: counts.votedCount,
    totalVoters: counts.totalVoters,
    verdict: trial.verdict ?? null,
    hasVoted: myVote !== null,
    myVote: myVote ? myVote.guilty : null,
    remainingSeconds: remainingSecondsFrom(trial.statementEndsAt),
  } satisfies VoteResultResponse)
})

// POST /api/trials/:trialId/statement/end — 최후진술 종료(현행범만) → VOTING, trial:status broadcast.
trialRoutes.post("/trials/:trialId/statement/end", async (c) => {
  const uuid = requireUser(c)
  const trialId = Number(c.req.param("trialId"))
  const trial = await prisma.trial.findUnique({
    where: { id: trialId },
    include: { case: true },
  })
  if (!trial) throw notFound("TRIAL_NOT_FOUND", "재판을 찾을 수 없습니다")
  if (trial.case.defendantUuid !== uuid) {
    throw forbidden("NOT_DEFENDANT", "현행범만 최후진술을 종료할 수 있습니다")
  }
  assertCanEndStatement(trial.status)

  await prisma.trial.update({
    where: { id: trialId },
    data: { status: "VOTING" },
  })

  const sys = await createSystemMessage(
    prisma,
    trial.case.roomId,
    trial.caseId,
    "⏱️ 최후진술이 종료되었습니다. 평결을 시작합니다"
  )
  emitChatMessage(trial.case.roomId, sys)
  emitTrialStatus(trialId, { trialId, status: "VOTING" })

  return c.json({ trialId, status: "VOTING" } satisfies TrialStatusResponse)
})

// POST /api/trials/:trialId/end — 선고 ⭐ (평결 확정·전과 갱신·사건 전이) → verdict:revealed broadcast.
trialRoutes.post("/trials/:trialId/end", async (c) => {
  requireUser(c)
  const trialId = Number(c.req.param("trialId"))
  const trial = await prisma.trial.findUnique({
    where: { id: trialId },
    include: {
      case: { include: { defendant: { select: { nickname: true } } } },
    },
  })
  if (!trial) throw notFound("TRIAL_NOT_FOUND", "재판을 찾을 수 없습니다")
  assertCanEndTrial(trial.status) // VOTING 에서만(중복 선고 방지)

  const roomId = trial.case.roomId
  const defendantUuid = trial.case.defendantUuid

  // 집계·평결·상태전이·전과갱신·시스템메시지를 한 트랜잭션으로(선고 원자성).
  //   tally 를 tx 안으로 옮겨 verdict 확정과 같은 스냅샷·원자로 묶는다.
  //   유죄면 전과+1·칭호 EX_CONVICT. 선고 공지는 방 본문(ROOM, caseId=null)으로(decision §3).
  const { verdict, caseStatus, counts, defendant, sys } =
    await prisma.$transaction(async (tx) => {
      const counts = await tally(tx, trialId, roomId)
      const verdict = computeVerdict(counts)
      const caseStatus = caseStatusAfterVerdict(verdict)

      await tx.trial.update({
        where: { id: trialId },
        data: { status: "ENDED", verdict },
      })
      await tx.case.update({
        where: { id: trial.caseId },
        data: { status: caseStatus },
      })
      const member =
        verdict === "GUILTY"
          ? await tx.member.update({
              where: { roomId_userUuid: { roomId, userUuid: defendantUuid } },
              data: { convictionCount: { increment: 1 }, title: "EX_CONVICT" },
            })
          : await tx.member.findUnique({
              where: { roomId_userUuid: { roomId, userUuid: defendantUuid } },
            })

      const defendant = {
        uuid: defendantUuid,
        nickname: trial.case.defendant.nickname,
        newTitle: member?.title ?? "CITIZEN",
        convictionCount: member?.convictionCount ?? 0,
      }

      const sys = await createSystemMessage(
        tx,
        roomId,
        null,
        verdict === "GUILTY"
          ? `⚖️ 유죄 확정! ${defendant.nickname}님이 전과 ${defendant.convictionCount}범이 되었습니다`
          : `⚖️ 무죄! ${defendant.nickname}님이 풀려났습니다`
      )
      return { verdict, caseStatus, counts, defendant, sys }
    })

  emitChatMessage(roomId, sys)
  emitVerdictRevealed(roomId, trialId, {
    trialId,
    verdict,
    guiltyCount: counts.guiltyCount,
    notGuiltyCount: counts.notGuiltyCount,
    defendant,
    caseStatus,
  })

  return c.json({
    trialId,
    status: "ENDED",
    verdict,
    guiltyCount: counts.guiltyCount,
    notGuiltyCount: counts.notGuiltyCount,
    defendant,
    caseStatus,
  } satisfies TrialEndResponse)
})
