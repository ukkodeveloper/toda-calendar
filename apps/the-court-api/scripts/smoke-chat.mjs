// 현행범 chat 오버홀 — 라이브 스모크 (REST + WS 멱등)
//
// 목적: seq 할당·대화 해소·시스템메시지 방귀속·BigInt 직렬화·keyset 커서·읽음 워터마크·
//       WS chat:send 멱등(같은 clientMsgId 2회 → 1행)을 실 서버+실 DB 로 증명한다.
//       (vitest 는 순수 유닛만 — DB 필요한 이 스모크는 수동 실행.)
//
// 실행:
//   1) DB 준비 + 마이그레이션:  DATABASE_URL=... pnpm exec prisma migrate deploy --schema prisma/schema.prisma
//   2) 서버 기동:               DATABASE_URL=... PORT=8899 node dist/index.js   (먼저 pnpm build)
//   3) 스모크:                  BASE_URL=http://localhost:8899 node scripts/smoke-chat.mjs
//
// 종료코드 0 = 전부 통과. socket.io-client 는 이 앱의 devDependency.
import { io } from "socket.io-client"

const BASE = process.env.BASE_URL || "http://localhost:8899"
let pass = 0,
  fail = 0
const ok = (c, m) => {
  if (c) {
    pass++
    console.log("  ✓", m)
  } else {
    fail++
    console.log("  ✗ FAIL:", m)
  }
}

async function j(method, path, { uuid, body } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (uuid) headers["X-User-Uuid"] = uuid
  const r = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: r.status, data }
}

console.log(`\n[smoke] BASE=${BASE}`)
console.log("=== 1) users ===")
const u1 = (
  await j("POST", "/api/users", {
    body: { nickname: "배고픈 판다", color: "#FF5733" },
  })
).data
const u2 = (
  await j("POST", "/api/users", {
    body: { nickname: "성난 다람쥐", color: "#33AAFF" },
  })
).data
ok(u1.uuid && u2.uuid, `two users created`)

console.log("=== 2) room + join ===")
const room = (
  await j("POST", "/api/rooms", {
    uuid: u1.uuid,
    body: { title: "다이어트 모임" },
  })
).data
ok(room.roomId && room.participationCode, `room ${room.roomId}`)
const joined = await j("POST", "/api/rooms/join", {
  uuid: u2.uuid,
  body: { participationCode: room.participationCode },
})
ok(joined.status === 200, `u2 joined`)

console.log("=== 3) 공표 → 시스템메시지는 ROOM 본문(caseId=null) ===")
const decl = await j("POST", `/api/rooms/${room.roomId}/cases`, {
  uuid: u1.uuid,
  body: {
    title: "야식 금지",
    content: "밤 9시 이후 금식",
    startDate: "2026-07-12T00:00:00.000Z",
    deadline: "2026-07-20T00:00:00.000Z",
  },
})
ok(decl.status === 201, `공표 201 → caseId ${decl.data.caseId}`)
const caseId = decl.data.caseId

console.log(
  "=== 4) GET messages → 공표: seq=1, caseId=null, SYSTEM, messageId numeric ==="
)
let msgs = (
  await j("GET", `/api/rooms/${room.roomId}/messages`, { uuid: u1.uuid })
).data
ok(Array.isArray(msgs) && msgs.length === 1, `1 message`)
const m1 = msgs[0]
ok(m1.seq === 1, `seq === 1 (got ${m1.seq})`)
ok(m1.caseId === null, `공표 in ROOM body (caseId null)`)
ok(m1.type === "SYSTEM", `type SYSTEM`)
ok(typeof m1.messageId === "number", `messageId numeric (BigInt cast ok)`)
ok("clientMsgId" in m1, `clientMsgId field present`)

console.log("=== 5) photo + 고발 → trial + 시스템메시지 ROOM(seq=2) ===")
const fd = new FormData()
fd.append(
  "file",
  new Blob([Buffer.from("iVBORw0KGgo=", "base64")], { type: "image/png" }),
  "e.png"
)
const pr = await fetch(BASE + "/api/photos", {
  method: "POST",
  headers: { "X-User-Uuid": u2.uuid },
  body: fd,
})
const photo = await pr.json()
ok(pr.status === 201 && photo.photoId, `photo ${photo.photoId}`)
const rep = await j("POST", "/api/reports", {
  uuid: u2.uuid,
  body: { caseId, photoId: photo.photoId },
})
ok(
  rep.status === 201 && rep.data.trialId,
  `고발 201 → trial ${rep.data.trialId}`
)

console.log("=== 6) GET messages → 공표(1)+고발(2), gapless, ROOM 본문 ===")
msgs = (await j("GET", `/api/rooms/${room.roomId}/messages`, { uuid: u1.uuid }))
  .data
ok(msgs.length === 2, `2 messages`)
ok(msgs.map((m) => m.seq).join(",") === "1,2", `seq gapless 1,2`)
ok(
  msgs.every((m) => m.caseId === null),
  `both in ROOM body`
)

console.log("=== 7) keyset ?afterSeq=1 → seq 2 만 ===")
const after = (
  await j("GET", `/api/rooms/${room.roomId}/messages?afterSeq=1`, {
    uuid: u1.uuid,
  })
).data
ok(after.length === 1 && after[0].seq === 2, `afterSeq=1 → [seq2]`)

console.log("=== 8) 읽음 워터마크 ===")
await j("POST", `/api/rooms/${room.roomId}/read`, {
  uuid: u1.uuid,
  body: { seq: 2 },
})
const r1 = (await j("GET", "/api/rooms", { uuid: u1.uuid })).data.find(
  (r) => r.roomId === room.roomId
)
ok(r1 && r1.hasUnread === false, `u1 hasUnread false after read`)
const r2 = (await j("GET", "/api/rooms", { uuid: u2.uuid })).data.find(
  (r) => r.roomId === room.roomId
)
ok(r2 && r2.hasUnread === true, `u2 hasUnread true`)

console.log("=== 9) WS chat:send 멱등 — 같은 clientMsgId 2회 → 1행 ===")
const sameId = "11111111-1111-4111-8111-111111111111"
const sock = io(BASE, { auth: { uuid: u2.uuid }, transports: ["websocket"] })
await new Promise((res, rej) => {
  sock.on("connect", res)
  sock.on("connect_error", rej)
  setTimeout(() => rej(new Error("ws connect timeout")), 5000)
})
sock.emit("room:join", { roomId: room.roomId })
await new Promise((r) => setTimeout(r, 200))
const sendAck = (payload) =>
  new Promise((res) =>
    sock
      .timeout(4000)
      .emit("chat:send", payload, (err, ack) =>
        res(err ? { status: "timeout" } : ack)
      )
  )
const ack1 = await sendAck({
  roomId: room.roomId,
  content: "나 지금 치킨 시킴",
  clientMsgId: sameId,
})
const ack2 = await sendAck({
  roomId: room.roomId,
  content: "나 지금 치킨 시킴",
  clientMsgId: sameId,
})
ok(ack1?.status === "ok", `first ack ok (seq ${ack1?.message?.seq})`)
ok(ack2?.status === "ok", `retry ack ok`)
ok(ack1?.message?.seq === ack2?.message?.seq, `idempotent: same seq echoed`)
ok(ack1?.message?.clientMsgId === sameId, `clientMsgId echoed`)
const finalMsgs = (
  await j("GET", `/api/rooms/${room.roomId}/messages`, { uuid: u2.uuid })
).data
ok(
  finalMsgs.filter((m) => m.content === "나 지금 치킨 시킴").length === 1,
  `exactly ONE chicken message despite double-send`
)
sock.close()

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`)
process.exit(fail === 0 ? 0 : 1)
