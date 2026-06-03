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

const AREA_TO_REGION = {
  1: 'seoul',    2: 'incheon',  3: 'daejeon',  4: 'daegu',    5: 'gwangju',
  6: 'busan',    7: 'ulsan',    8: 'sejong',
  31: 'gyeonggi', 32: 'gangwon', 33: 'chungbuk', 34: 'chungnam',
  35: 'gyeongbuk', 36: 'gyeongnam', 37: 'jeonbuk', 38: 'jeonnam',
  39: 'jeju',
}
const CTYPE_TO_CATEGORY = {
  12: 'sight', 14: 'sight', 15: 'activity', 28: 'activity', 32: 'stay', 39: 'food',
}

// 17지역 × 4카테고리 = 68조합. 각 조합은 areaCode + contentTypeId.
// 카테고리 contentTypeId: 12=관광지(sight), 28=레포츠(activity), 32=숙박(stay), 39=음식(food).
// label은 로그용. AREA_TO_REGION으로 region id 얻음.
const COMBINATIONS = (() => {
  const list = []
  const types = [
    { contentTypeId: 39, cat: 'food' },
    { contentTypeId: 12, cat: 'sight' },
    { contentTypeId: 28, cat: 'activity' },
    { contentTypeId: 32, cat: 'stay' },
  ]
  for (const [code, region] of Object.entries(AREA_TO_REGION)) {
    for (const t of types) {
      list.push({
        areaCode: Number(code),
        contentTypeId: t.contentTypeId,
        label: `${region}/${t.cat}`,
      })
    }
  }
  return list
})()

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

  // 오늘 처리할 조합 슬라이드 결정.
  // 하루 6조합 × COMBINATIONS 68조합 = 약 12일에 1순환.
  // 만약 데이터 추가가 더 필요하면 BATCH_SIZE를 키울 수 있지만 Vercel function timeout(30s)
  // + TourAPI rate limit 고려하여 6이 안전.
  const BATCH_SIZE = 6
  const today = new Date()
  const doy = dayOfYear(today)
  const totalCombos = COMBINATIONS.length
  const cyclesPerDay = Math.ceil(totalCombos / BATCH_SIZE)  // 한 순환에 필요한 일수 ≈ 12
  // 오늘의 슬라이드 시작 인덱스
  const slideStart = (doy % cyclesPerDay) * BATCH_SIZE
  // 순환 횟수 (총 doy 기준, pageNo 결정용)
  const cycle = Math.floor(doy / cyclesPerDay)
  const pageNo = (cycle % 10) + 1  // pageNo 1~10 순환
  const numOfRows = 30

  // 오늘 처리할 조합들 (slideStart부터 BATCH_SIZE개, 끝에 도달하면 wrap-around)
  const todayCombos = []
  for (let i = 0; i < BATCH_SIZE; i++) {
    todayCombos.push(COMBINATIONS[(slideStart + i) % totalCombos])
  }

  let conn
  try {
    conn = await getConnection()
  } catch (err) {
    return res.status(500).json({ error: 'db_connect_failed', message: err.message })
  }

  const perComboResults = []
  let totalInserted = 0
  let totalSkipped = 0
  let totalFetched = 0

  // 각 조합 순차 처리. 병렬 호출은 TourAPI rate limit 위험.
  for (const combo of todayCombos) {
    const region = AREA_TO_REGION[combo.areaCode]
    const ctype = combo.contentTypeId

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
        perComboResults.push({ combo: combo.label, error: `http_${apiRes.status}` })
        continue
      }
      const text = await apiRes.text()
      json = JSON.parse(text)
      const resultCode = json?.response?.header?.resultCode
      if (resultCode !== '0000') {
        perComboResults.push({ combo: combo.label, error: `tour_${resultCode}` })
        continue
      }
    } catch (err) {
      perComboResults.push({ combo: combo.label, error: `fetch_${err.message}` })
      continue
    }

    const items = extractItems(json)
    totalFetched += items.length
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
      perComboResults.push({
        combo: combo.label, error: `db_${err.message}`,
        inserted, skipped, fetched: items.length,
      })
      continue
    }

    totalInserted += inserted
    totalSkipped += skipped
    perComboResults.push({
      combo: combo.label,
      fetched: items.length,
      inserted,
      skipped,
    })
  }

  try { await conn.end() } catch { /* noop */ }

  return res.status(200).json({
    ok: true,
    doy,
    cycle,
    pageNo,
    slideStart,
    batchSize: BATCH_SIZE,
    totalCombosInSystem: totalCombos,
    totalFetched,
    totalInserted,
    totalSkipped,
    perCombo: perComboResults,
    ts: new Date().toISOString(),
  })
}
