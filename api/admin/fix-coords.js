// POST /api/admin/fix-coords
// 한국 영역 외 좌표를 가진 places를 is_active=0으로 비활성화.
// MIGRATE_SECRET 헤더 필요. 멱등 (반복 호출 안전).
// 한국 영역: lat 33~39, lng 124~132.
import { getConnection } from '../_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const secret = req.headers['x-migrate-secret']
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  let conn
  try {
    conn = await getConnection()

    // 1) 영향 받을 행 미리 조회 (응답에 포함)
    const [rows] = await conn.query(
      `SELECT id, name, region, lat, lng FROM places
       WHERE is_active = 1
         AND (lat < 33 OR lat > 39 OR lng < 124 OR lng > 132)`,
    )

    // 2) 일괄 비활성화
    const [result] = await conn.query(
      `UPDATE places SET is_active = 0
       WHERE is_active = 1
         AND (lat < 33 OR lat > 39 OR lng < 124 OR lng > 132)`,
    )

    return res.status(200).json({
      ok: true,
      affected: result.affectedRows,
      deactivated: rows.map(r => ({
        id: r.id, name: r.name, region: r.region, lat: r.lat, lng: r.lng,
      })),
    })
  } catch (err) {
    return res.status(500).json({ error: 'db_error', message: err.message })
  } finally {
    try { await conn?.end() } catch { /* noop */ }
  }
}
