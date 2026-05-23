// POST /api/auth/demo
// 데모 시연용 임시 진입. body: { email, password }.
// DEMO_ADMIN_EMAIL + DEMO_ADMIN_PASSWORD 환경변수와 일치하면 데모 user를 upsert하고
// 세션 JWT 쿠키 발급.
//
// Kill switch: DEMO_ADMIN_EMAIL이 미설정이면 endpoint 자체가 비활성 (404).
// 시연 종료 시 환경변수만 삭제하면 진입 차단 + 코드 변경 불필요.
import crypto from 'node:crypto'
import { getConnection } from '../_lib/db.js'
import { signSessionJwt, buildSessionCookie } from '../_lib/session.js'

const DEMO_USER_ID = 'u_demo_admin'

function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const expectedEmail = process.env.DEMO_ADMIN_EMAIL
  const expectedPassword = process.env.DEMO_ADMIN_PASSWORD
  // Kill switch: 두 env 중 하나라도 미설정이면 endpoint 비활성
  if (!expectedEmail || !expectedPassword) {
    return res.status(404).json({ error: 'not_found' })
  }

  const { email, password } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'invalid_body' })
  }

  const emailMatch = timingSafeEqualStr(email.toLowerCase().trim(), expectedEmail.toLowerCase().trim())
  const passwordMatch = timingSafeEqualStr(password, expectedPassword)
  if (!emailMatch || !passwordMatch) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  // 데모 user upsert
  let conn
  try {
    conn = await getConnection()
    await conn.query(
      `INSERT INTO users (id, provider, provider_uid, email, nickname, is_admin)
       VALUES (?, 'demo', 'demo_admin', ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email),
         nickname = VALUES(nickname),
         is_admin = 1`,
      [DEMO_USER_ID, expectedEmail.toLowerCase().trim(), '데모 관리자'],
    )

    // 세션 JWT 발급
    const token = await signSessionJwt({ sub: DEMO_USER_ID })
    res.setHeader('Set-Cookie', buildSessionCookie(token))
    return res.status(200).json({
      ok: true,
      user: {
        id: DEMO_USER_ID,
        provider: 'demo',
        email: expectedEmail.toLowerCase().trim(),
        nickname: '데모 관리자',
        isAdmin: true,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: 'db_error', message: err.message })
  } finally {
    if (conn) { try { await conn.end() } catch { /* noop */ } }
  }
}
