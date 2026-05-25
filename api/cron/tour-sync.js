// GET /api/cron/tour-sync
// Vercel cron으로 매일 한국시간 04:00 (UTC 19:00) 자동 호출.
// 12조합(부/서/제 × food/sight/activity/stay) 중 day-of-year mod 12에 해당하는
// 하나만 호출 — 일별로 다른 조합. 1순환(12일) 완료 후엔 pageNo 증가하여 더 깊은 페이지.
//
// 인증: Vercel cron이 자동 추가하는 'x-vercel-cron' 헤더만 신뢰.
// (cron-secret env 환경변수 추가 검증도 옵션이지만 단순화)
//
// 응답: cron worker가 사실상 무시 (200/4xx/5xx만 봄). 본문은 로그용.

import crypto from 'node:crypto'
import { getConnection } from '../_lib/db.js'

const AREA_TO_REGION = { 1: 'seoul', 6: 'busan', 39: 'jeju' }
const CTYPE_TO_CATEGORY = {
  12: 'sight', 14: 'sight', 15: 'activity', 28: 'activity', 32: 'stay', 39: 'food',
}

// 12조합 — day-of-year mod 12 인덱스로 회전
const COMBINATIONS = [
  { areaCode: 1,  contentTypeId: 39, label: 'seoul/food' },
  { areaCode: 1,  contentTypeId: 12, label: 'seoul/sight' },
  { areaCode: 1,  contentTypeId: 28, label: 'seoul/activity' },
  { areaCode: 1,  contentTypeId: 32, label: 'seoul/stay' },
  { areaCode: 6,  contentTypeId: 39, label: 'busan/food' },
  { areaCode: 6,  contentTypeId: 12, label: 'busan/sight' },
  { areaCode: 6,  contentTypeId: 28, label: 'busan/activity' },
  { areaCode: 6,  contentTypeId: 32, label: 'busan/stay' },
  { areaCode: 39, contentTypeId: 39, label: 'jeju/food' },
  { areaCode: 39, contentTypeId: 12, label: 'jeju/sight' },
  { areaCode: 39, contentTypeId: 28, label: 'jeju/activity' },
  { areaCode: 39, contentTypeId: 32, label: 'jeju/stay' },
]

function classifyCategory(contentTypeId, title) {
  const base = CTYPE_TO_CATEGORY[contentTypeId]
  if (!base) return null
  if (contentTypeId === 39 && /카페|커피|디저트|베이커리/.test(title || '')) return 'cafe'
  return base
}

function extractItems(json) {
  const items = json?.response?.body?.items?.item
  if (!items) return []
  return Array.isArray(items) ? items : [items]
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / 86400000)
}

export default async function handler(req, res) {
  // 인증: Vercel cron만 허용. 외부에서 직접 호출 차단.
  // 추가 가드: CRON_SECRET env 있으면 Authorization 헤더 검증.
  const cronHeader = req.headers['x-vercel-cron']
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  const isCron = !!cronHeader
  const isAuthed = cronSecret && authHeader === `Bearer ${cronSecret}`
  if (!isCron && !isAuthed) {
    return res.status(401).json({ error: 'cron_only' })
  }

  const serviceKey = process.env.TOUR_API_SERVICE_KEY
  if (!serviceKey) {
    return res.status(500).json({ error: 'no_service_key' })
  }

  // 오늘 인덱스 결정
  const today = new Date()
  const doy = dayOfYear(today)
  const comboIdx = doy % 12
  const cycle = Math.floor(doy / 12)
  // pageNo: 1순환째는 1, 2순환째는 2, ... (이미 들어온 데이터는 INSERT IGNORE로 차단)
  const pageNo = (cycle % 10) + 1  // pageNo 1~10 순환 — TourAPI page 깊이 한계 대비
  const numOfRows = 30
  const combo = COMBINATIONS[comboIdx]

  const region = AREA_TO_REGION[combo.areaCode]
  const ctype = combo.contentTypeId

  let conn
  try {
    conn = await getConnection()
  } catch (err) {
    return res.status(500).json({ error: 'db_connect_failed', message: err.message })
  }

  // TourAPI 호출
  const params = new URLSearchParams({
    serviceKey,
    MobileOS: 'ETC',
    MobileApp: 'AlAseo',
    _type: 'json',
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    arrange: 'A',
    areaCode: String(combo.areaCode),
    contentTypeId: String(ctype),
  })
  const url = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?${params.toString()}`

  let json
  try {
    const apiRes = await fetch(url)
    if (!apiRes.ok) {
      await conn.end()
      return res.status(502).json({ error: 'tour_api_failed', status: apiRes.status })
    }
    const text = await apiRes.text()
    json = JSON.parse(text)
    const resultCode = json?.response?.header?.resultCode
    if (resultCode !== '0000') {
      await conn.end()
      return res.status(502).json({ error: 'tour_api_error', resultCode })
    }
  } catch (err) {
    try { await conn.end() } catch { /* noop */ }
    return res.status(502).json({ error: 'tour_api_fetch_failed', message: err.message })
  }

  const items = extractItems(json)
  let inserted = 0
  let skipped = 0

  try {
    for (const item of items) {
      const lat = Number(item.mapy)
      const lng = Number(item.mapx)
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
        skipped++
        continue
      }
      const category = classifyCategory(ctype, item.title)
      if (!category) {
        skipped++
        continue
      }
      const externalId = `tour_${item.contentid}`
      const ourId = `p_${crypto.randomBytes(6).toString('hex')}`
      const photo = item.firstimage || item.firstimage2 || null
      const addr = [item.addr1, item.addr2].filter(Boolean).join(' ').trim() || null

      // cron은 자동으로 review_status='approved'로 넣음 (시연 환경, 운영 시엔 pending 권장)
      const [result] = await conn.query(
        `INSERT IGNORE INTO places
         (id, external_id, region, category, name, lat, lng, photo,
          rating, review_count, price_level, duration, tags, description,
          is_active, review_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, 1, 60, '[]', ?, 1, 'approved')`,
        [ourId, externalId, region, category, item.title || '(이름 없음)', lat, lng, photo, addr],
      )
      if (result.affectedRows === 1) inserted++
      else skipped++
    }
  } catch (err) {
    try { await conn.end() } catch { /* noop */ }
    return res.status(500).json({ error: 'db_insert_failed', message: err.message, inserted })
  }

  await conn.end()
  return res.status(200).json({
    ok: true,
    combo: combo.label,
    pageNo,
    cycle,
    doy,
    totalFetched: items.length,
    inserted,
    skipped,
    ts: new Date().toISOString(),
  })
}
