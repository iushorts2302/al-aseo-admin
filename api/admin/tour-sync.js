// POST /api/admin/tour-sync
// 관리자 인증 필요. body: { areaCode, contentTypeId, pageNo?, numOfRows? }
// TourAPI areaBasedList2를 호출, 매핑 후 INSERT IGNORE.
// 자동 수집은 review_status='pending'으로 들어감 — 관리자 검토 필요.
import crypto from 'node:crypto'
import { getUserFromRequest } from '../_lib/session.js'
import { getConnection } from '../_lib/db.js'

// TourAPI areaCode → 우리 region (17개 광역지자체).
// api/cron/tour-sync.js의 AREA_TO_REGION과 1:1 일치해야 함.
// 둘 중 한 쪽만 업데이트하면 UI(select)는 17개 보이는데 백엔드 검증이
// 'invalid_areaCode'로 거부하는 불일치 발생. 한 군데 바꿀 때 양쪽 모두 확인.
const AREA_TO_REGION = {
  1: 'seoul',    2: 'incheon',  3: 'daejeon',  4: 'daegu',    5: 'gwangju',
  6: 'busan',    7: 'ulsan',    8: 'sejong',
  31: 'gyeonggi', 32: 'gangwon', 33: 'chungbuk', 34: 'chungnam',
  35: 'gyeongbuk', 36: 'gyeongnam', 37: 'jeonbuk', 38: 'jeonnam',
  39: 'jeju',
}

// TourAPI contentTypeId → 우리 category
// 25(여행코스), 38(쇼핑)은 skip
const CTYPE_TO_CATEGORY = {
  12: 'sight',     // 관광지
  14: 'sight',     // 문화시설
  15: 'activity',  // 축제/공연/행사
  28: 'activity',  // 레포츠
  32: 'stay',      // 숙박
  39: 'food',      // 음식점
}

// 음식점(39)의 title에 "카페" 들어있으면 cafe로 재분류
function classifyCategory(contentTypeId, title) {
  const baseCategory = CTYPE_TO_CATEGORY[contentTypeId]
  if (!baseCategory) return null
  if (contentTypeId === 39 && /카페|커피|디저트|베이커리/.test(title || '')) {
    return 'cafe'
  }
  return baseCategory
}

async function requireAdmin(req, res) {
  const session = await getUserFromRequest(req)
  if (!session) {
    res.status(401).json({ error: 'unauthenticated' })
    return null
  }
  let conn
  try {
    conn = await getConnection()
    const [rows] = await conn.query('SELECT is_admin FROM users WHERE id = ?', [session.sub])
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

// TourAPI 응답에서 items 추출. TourAPI는 0건일 때 items가 빈 문자열 또는 객체로 옴 — 방어적 처리.
function extractItems(json) {
  const body = json?.response?.body
  if (!body) return []
  const items = body.items
  if (!items || typeof items !== 'object') return []
  const item = items.item
  if (!item) return []
  return Array.isArray(item) ? item : [item]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const auth = await requireAdmin(req, res)
  if (!auth) return
  const { conn } = auth

  const serviceKey = process.env.TOUR_API_SERVICE_KEY
  if (!serviceKey) {
    return res.status(500).json({ error: 'service_key_not_configured' })
  }

  const { areaCode, contentTypeId, pageNo = 1, numOfRows = 50 } = req.body || {}
  const area = Number(areaCode)
  const ctype = Number(contentTypeId)
  if (!AREA_TO_REGION[area]) {
    return res.status(400).json({ error: 'invalid_areaCode', supported: Object.keys(AREA_TO_REGION) })
  }
  if (!CTYPE_TO_CATEGORY[ctype]) {
    return res.status(400).json({ error: 'invalid_contentTypeId', supported: Object.keys(CTYPE_TO_CATEGORY) })
  }
  if (numOfRows < 1 || numOfRows > 100) {
    return res.status(400).json({ error: 'invalid_numOfRows' })
  }

  const region = AREA_TO_REGION[area]

  // TourAPI 호출
  const params = new URLSearchParams({
    serviceKey,
    MobileOS: 'ETC',
    MobileApp: 'AlAseo',
    _type: 'json',
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    arrange: 'A',
    areaCode: String(area),
    contentTypeId: String(ctype),
  })
  const url = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?${params.toString()}`

  let json
  try {
    const apiRes = await fetch(url)
    if (!apiRes.ok) {
      return res.status(502).json({ error: 'tour_api_failed', status: apiRes.status })
    }
    const text = await apiRes.text()
    try {
      json = JSON.parse(text)
    } catch {
      // TourAPI는 인증 실패 시 XML 에러 반환
      return res.status(502).json({ error: 'tour_api_non_json', preview: text.slice(0, 200) })
    }
    // resultCode 체크 (성공: '0000')
    const resultCode = json?.response?.header?.resultCode
    if (resultCode !== '0000') {
      return res.status(502).json({
        error: 'tour_api_error',
        resultCode,
        resultMsg: json?.response?.header?.resultMsg,
      })
    }
  } catch (err) {
    if (conn) { try { await conn.end() } catch { /* noop */ } }
    return res.status(502).json({ error: 'tour_api_fetch_failed', message: err.message })
  }

  const items = extractItems(json)
  const totalCount = json?.response?.body?.totalCount || 0

  // 매핑 + INSERT IGNORE
  let inserted = 0
  let skipped = 0
  const errors = []

  try {
    for (const item of items) {
      try {
        // 좌표가 없으면 skip
        const lat = Number(item.mapy)
        const lng = Number(item.mapx)
        // 좌표 검증 — 한국 영역 안만 (lat 33~39, lng 124~132).
        // TourAPI 일부 placeholder 좌표(중국 19.69, 117.99 등) 차단.
        // api/cron/tour-sync.js와 동일 가드.
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
          skipped++
          continue
        }
        if (lat < 33 || lat > 39 || lng < 124 || lng > 132) {
          skipped++
          continue
        }

        const category = classifyCategory(ctype, item.title)
        if (!category) {
          skipped++
          continue
        }

        // external_id: 충돌 방지를 위해 tour_ prefix
        const externalId = `tour_${item.contentid}`
        const ourId = `p_${crypto.randomBytes(6).toString('hex')}`
        const photo = item.firstimage || item.firstimage2 || null
        const addr = [item.addr1, item.addr2].filter(Boolean).join(' ').trim() || null

        const [result] = await conn.query(
          `INSERT IGNORE INTO places
           (id, external_id, region, category, name, lat, lng, photo,
            rating, review_count, price_level, duration, tags, description,
            is_active, review_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, 1, 60, '[]', ?, 1, 'pending')`,
          [ourId, externalId, region, category, item.title || '(이름 없음)', lat, lng, photo, addr],
        )
        if (result.affectedRows === 1) inserted++
        else skipped++  // external_id 충돌 (이미 있음)
      } catch (itemErr) {
        errors.push({ contentid: item.contentid, message: itemErr.message })
      }
    }

    return res.status(200).json({
      ok: true,
      areaCode: area,
      contentTypeId: ctype,
      pageNo,
      numOfRows,
      totalCount,
      fetched: items.length,
      inserted,
      skipped,
      errors,
    })
  } catch (err) {
    return res.status(500).json({ error: 'db_error', message: err.message })
  } finally {
    if (conn) { try { await conn.end() } catch { /* noop */ } }
  }
}
