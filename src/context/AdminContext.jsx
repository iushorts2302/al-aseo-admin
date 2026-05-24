import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  REGIONS as INITIAL_REGIONS,
  CATEGORIES as INITIAL_CATEGORIES,
} from '../data/places.js'

const AdminContext = createContext(null)

const LS_REGIONS   = 'al-aseo:regions'
const LS_CATS      = 'al-aseo:categories'

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function writeLS(key, val) {
  try {
    if (val == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(val))
  } catch (err) {
    console.warn('localStorage 저장 실패', key, err)
  }
}

async function apiFetch(path, options = {}) {
  const { method = 'GET', body } = options
  const init = { method, credentials: 'same-origin', headers: {} }
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const res = await fetch(path, init)
  const data = res.headers.get('content-type')?.includes('application/json')
    ? await res.json().catch(() => null) : null
  if (!res.ok) {
    const err = new Error(data?.error || `http_${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState(null)

  // 장소: 서버 source of truth. /api/admin/places는 관리자만 접근 가능.
  // 비관리자 상태에선 빈 배열.
  const [places, setPlaces] = useState([])
  const [placesLoading, setPlacesLoading] = useState(false)
  const [placesError, setPlacesError] = useState(null)

  // 지역/카테고리는 6c 범위 밖 — 일단 localStorage 그대로
  const [regions, setRegions] = useState(() => readLS(LS_REGIONS, INITIAL_REGIONS))
  const [categories, setCategories] = useState(() => readLS(LS_CATS, INITIAL_CATEGORIES))
  useEffect(() => { writeLS(LS_REGIONS, regions) }, [regions])
  useEffect(() => { writeLS(LS_CATS, categories) }, [categories])

  // 마운트 시 세션 확인
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'same-origin' })
        if (cancelled) return
        if (res.ok) {
          const { user } = await res.json()
          setAdmin(user)
          setSessionError(null)
        } else if (res.status === 403) {
          setSessionError('not_admin')
        } else {
          setSessionError('unauthenticated')
        }
      } catch {
        setSessionError('network_error')
      } finally {
        if (!cancelled) setSessionLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // admin이 확인되면 places 로드
  const refreshPlaces = useCallback(async () => {
    setPlacesLoading(true)
    setPlacesError(null)
    try {
      const data = await apiFetch('/api/admin/places')
      setPlaces(data.places || [])
    } catch (err) {
      setPlacesError(err.message)
    } finally {
      setPlacesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (admin) refreshPlaces()
    else setPlaces([])
  }, [admin, refreshPlaces])

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch { /* noop */ }
    setAdmin(null)
    setSessionError('unauthenticated')
  }

  // 데모 계정 로그인 (시연용 임시).
  // 성공 시 admin/sessionError 갱신, 호출자가 별도 처리 불필요.
  // 실패 시 에러 메시지 throw.
  async function demoLogin(email, password) {
    const res = await fetch('/api/auth/demo', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      if (res.status === 404) throw new Error('데모 로그인이 비활성화되어 있습니다.')
      if (res.status === 401) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
      throw new Error(data?.error || `로그인 실패 (${res.status})`)
    }
    const { user } = await res.json()
    setAdmin(user)
    setSessionError(null)
  }

  // ── 장소 CRUD (서버 source of truth) ──
  // 호출자가 try/catch로 처리할 수 있도록 실패는 throw로 전달. UI 표시는 caller 책임.
  async function createPlace(data) {
    const { place } = await apiFetch('/api/admin/places', { method: 'POST', body: data })
    setPlaces(prev => [place, ...prev])
    return place
  }
  async function updatePlace(id, updates) {
    const { place } = await apiFetch(`/api/admin/places/${id}`, { method: 'PUT', body: updates })
    setPlaces(prev => prev.map(p => p.id === id ? place : p))
    return place
  }
  async function deletePlace(id) {
    await apiFetch(`/api/admin/places/${id}`, { method: 'DELETE' })
    setPlaces(prev => prev.filter(p => p.id !== id))
  }

  // TourAPI 수집 — 관리자 트리거. 신규 장소는 review_status='pending'으로 저장.
  // 결과 반환 후 자동 refresh.
  async function syncTourPlaces({ areaCode, contentTypeId, pageNo = 1, numOfRows = 50 }) {
    try {
      const result = await apiFetch('/api/admin/tour-sync', {
        method: 'POST',
        body: { areaCode, contentTypeId, pageNo, numOfRows },
      })
      // 신규 row 반영
      await refreshPlaces()
      return result  // { fetched, inserted, skipped, errors, totalCount }
    } catch (err) {
      throw new Error(`수집 실패: ${err.message}`)
    }
  }

  // ── 지역 CRUD (6c 범위 밖) ──
  function createRegion(data) {
    setRegions(prev => [...prev, { id: data.id || `r_${Date.now()}`, ...data }])
  }
  function updateRegion(id, updates) {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }
  function deleteRegion(id) {
    setRegions(prev => prev.filter(r => r.id !== id))
  }

  // ── 카테고리 CRUD ──
  function createCategory(data) {
    setCategories(prev => [...prev, { id: data.id || `c_${Date.now()}`, ...data }])
  }
  function updateCategory(id, updates) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }
  function deleteCategory(id) {
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  // ── 읽기 전용 통계 (사용자/여행 — localStorage 직접 read) ──
  function getUsers() {
    return readLS('al-aseo:users', [])
  }
  function getTrips() {
    return readLS('al-aseo:trips', [])
  }

  return (
    <AdminContext.Provider value={{
      admin, sessionLoading, sessionError, logout, demoLogin,
      places, placesLoading, placesError, refreshPlaces,
      createPlace, updatePlace, deletePlace, syncTourPlaces,
      regions, createRegion, updateRegion, deleteRegion,
      categories, createCategory, updateCategory, deleteCategory,
      getUsers, getTrips,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
