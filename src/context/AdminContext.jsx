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

  // ── 장소 CRUD (서버 source of truth) ──
  // PlaceManager 시그니처 보존: createPlace(data)는 newPlace 반환,
  // updatePlace(id, updates)는 void, deletePlace(id)는 void.
  // 모두 동기 호출 가능하지만 내부적으로 비동기. 호출부는 await 안 해도 동작.
  async function createPlace(data) {
    try {
      const { place } = await apiFetch('/api/admin/places', { method: 'POST', body: data })
      setPlaces(prev => [place, ...prev])
      return place
    } catch (err) {
      alert(`장소 생성 실패: ${err.message}`)
      return null
    }
  }
  async function updatePlace(id, updates) {
    try {
      const { place } = await apiFetch(`/api/admin/places/${id}`, { method: 'PUT', body: updates })
      setPlaces(prev => prev.map(p => p.id === id ? place : p))
    } catch (err) {
      alert(`장소 수정 실패: ${err.message}`)
    }
  }
  async function deletePlace(id) {
    try {
      await apiFetch(`/api/admin/places/${id}`, { method: 'DELETE' })
      setPlaces(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(`장소 삭제 실패: ${err.message}`)
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
      admin, sessionLoading, sessionError, logout,
      places, placesLoading, placesError, refreshPlaces,
      createPlace, updatePlace, deletePlace,
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
