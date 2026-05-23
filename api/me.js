// GET /api/me (관리자 웹)
// 세션 있고 + 해당 user가 is_admin=1이어야 200. 그 외 401/403.
// 별도 catch-all 없이 단일 파일로 충분 (관리자 웹은 me 외 다른 me/* 엔드포인트 없음).
import { getUserFromRequest } from './_lib/session.js'
import { getConnection } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const session = await getUserFromRequest(req)
  if (!session) return res.status(401).json({ error: 'unauthenticated' })

  let conn
  try {
    conn = await getConnection()
    const [rows] = await conn.query(
      'SELECT id, provider, email, nickname, avatar, is_admin, created_at FROM users WHERE id = ?',
      [session.sub],
    )
    if (rows.length === 0) return res.status(401).json({ error: 'user_not_found' })
    const u = rows[0]
    if (!u.is_admin) return res.status(403).json({ error: 'not_admin' })
    return res.status(200).json({
      user: {
        id: u.id, provider: u.provider, email: u.email, nickname: u.nickname,
        avatar: u.avatar, created_at: u.created_at, isAdmin: true,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: 'db_error', message: err.message })
  } finally {
    if (conn) { try { await conn.end() } catch { /* noop */ } }
  }
}
