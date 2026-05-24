// 관리자 places CRUD (catch-all).
//   GET    /api/admin/places           → 전체 목록 (is_active 무관, 관리자 화면용)
//   POST   /api/admin/places           → 생성 (body로 받음)
//   PUT    /api/admin/places/:id       → 수정 (부분 업데이트)
//   DELETE /api/admin/places/:id       → 비활성화 (soft delete, is_active=0)
//
// 모든 요청은 세션 + is_admin=1 필요. 그렇지 않으면 401/403.
import crypto from 'node:crypto'
import { getUserFromRequest } from '../../_lib/session.js'
import { getConnection } from '../../_lib/db.js'

async function requireAdmin(req, res) {
  const session = await getUserFromRequest(req)
  if (!session) {
    res.status(401).json({ error: 'unauthenticated' })
    return null
  }
  // DB에서 is_admin 확인 — 세션 발급 후 권한이 회수되면 즉시 차단됨
  let conn
  try {
    conn = await getConnection()
    const [rows] = await conn.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [session.sub],
    )
    if (rows.length === 0 || !rows[0].is_admin) {
      res.status(403).json({ error: 'not_admin' })
      return null
    }
    return { session, conn }
  } catch (err) {
    if (conn) { try { await conn.end() } catch { /* noop */ } }
    res.status(500).json({ error: 'db_error', message: err.message })
    return null
  }
}

function rowToPlace(r) {
  return {
    id: r.id,
    externalId: r.external_id,
    region: r.region,
    category: r.category,
    name: r.name,
    lat: Number(r.lat),
    lng: Number(r.lng),
    photo: r.photo,
    rating: r.rating != null ? Number(r.rating) : 0,
    reviewCount: r.review_count,
    priceLevel: r.price_level,
    duration: r.duration,
    tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
    desc: r.description,
    isActive: !!r.is_active,
    reviewStatus: r.review_status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export default async function handler(req, res) {
  const auth = await requireAdmin(req, res)
  if (!auth) return  // 응답 이미 전송됨
  const { conn } = auth
  // path는 Vercel rewrite에 따라 string 또는 string[]로 옴.
  // me catchall은 2회 path 파라미터(string[])로 들어오지만 admin places는
  // 단일 id만 받으므로 1회(string)로 들어옴. 둘 다 처리.
  const raw = req.query.path
  const segments = Array.isArray(raw) ? raw : (raw ? [raw] : [])
  const id = segments[0] || null
  const method = req.method

  try {
    // ── 목록 또는 생성 ──
    if (!id) {
      if (method === 'GET') {
        const [rows] = await conn.query(
          `SELECT id, external_id, region, category, name, lat, lng, photo, rating, review_count,
                  price_level, duration, tags, description, is_active, review_status, created_at, updated_at
           FROM places ORDER BY updated_at DESC`,
        )
        return res.status(200).json({ places: rows.map(rowToPlace) })
      }
      if (method === 'POST') {
        const b = req.body || {}
        if (!b.name || !b.region || !b.category || b.lat == null || b.lng == null) {
          return res.status(400).json({ error: 'invalid_body' })
        }
        const newId = b.id && /^p[_]?\w+$/.test(b.id) ? b.id : `p_${crypto.randomBytes(6).toString('hex')}`
        await conn.query(
          `INSERT INTO places
           (id, region, category, name, lat, lng, photo, rating, review_count, price_level, duration, tags, description, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            newId, b.region, b.category, b.name,
            Number(b.lat), Number(b.lng),
            b.photo || null,
            b.rating != null ? Number(b.rating) : null,
            b.reviewCount != null ? Number(b.reviewCount) : 0,
            b.priceLevel != null ? Number(b.priceLevel) : 1,
            b.duration != null ? Number(b.duration) : 60,
            JSON.stringify(b.tags || []),
            b.desc || null,
          ],
        )
        const [rows] = await conn.query(
          `SELECT id, external_id, region, category, name, lat, lng, photo, rating, review_count,
                  price_level, duration, tags, description, is_active, review_status, created_at, updated_at
           FROM places WHERE id = ?`,
          [newId],
        )
        return res.status(200).json({ place: rowToPlace(rows[0]) })
      }
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'method_not_allowed' })
    }

    // ── 단건 — PUT/DELETE ──
    if (method === 'PUT') {
      const b = req.body || {}
      // reviewStatus 유효성 검사
      const validStatuses = ['pending', 'approved', 'rejected']
      if (b.reviewStatus !== undefined && !validStatuses.includes(b.reviewStatus)) {
        return res.status(400).json({ error: 'invalid_review_status' })
      }
      const [result] = await conn.query(
        `UPDATE places SET
           region        = COALESCE(?, region),
           category      = COALESCE(?, category),
           name          = COALESCE(?, name),
           lat           = COALESCE(?, lat),
           lng           = COALESCE(?, lng),
           photo         = COALESCE(?, photo),
           rating        = COALESCE(?, rating),
           review_count  = COALESCE(?, review_count),
           price_level   = COALESCE(?, price_level),
           duration      = COALESCE(?, duration),
           tags          = COALESCE(?, tags),
           description   = COALESCE(?, description),
           is_active     = COALESCE(?, is_active),
           review_status = COALESCE(?, review_status)
         WHERE id = ?`,
        [
          b.region ?? null,
          b.category ?? null,
          b.name ?? null,
          b.lat != null ? Number(b.lat) : null,
          b.lng != null ? Number(b.lng) : null,
          b.photo ?? null,
          b.rating != null ? Number(b.rating) : null,
          b.reviewCount != null ? Number(b.reviewCount) : null,
          b.priceLevel != null ? Number(b.priceLevel) : null,
          b.duration != null ? Number(b.duration) : null,
          b.tags !== undefined ? JSON.stringify(b.tags) : null,
          b.desc ?? null,
          b.isActive === undefined ? null : (b.isActive ? 1 : 0),
          b.reviewStatus ?? null,
          id,
        ],
      )
      if (result.affectedRows === 0) return res.status(404).json({ error: 'not_found' })
      const [rows] = await conn.query(
        `SELECT id, external_id, region, category, name, lat, lng, photo, rating, review_count,
                price_level, duration, tags, description, is_active, review_status, created_at, updated_at
         FROM places WHERE id = ?`,
        [id],
      )
      return res.status(200).json({ place: rowToPlace(rows[0]) })
    }

    if (method === 'DELETE') {
      // soft delete: is_active=0. trip.days JSON에 박힌 참조가 깨지지 않도록.
      const [result] = await conn.query(
        `UPDATE places SET is_active = 0 WHERE id = ?`,
        [id],
      )
      if (result.affectedRows === 0) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'PUT, DELETE')
    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    return res.status(500).json({ error: 'db_error', message: err.message })
  } finally {
    if (conn) { try { await conn.end() } catch { /* noop */ } }
  }
}
