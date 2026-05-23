import { createContext, useContext, useState, useEffect } from 'react'
import {
  PLACES as INITIAL_PLACES,
  REGIONS as INITIAL_REGIONS,
  CATEGORIES as INITIAL_CATEGORIES,
} from '../data/places.js'

const AdminContext = createContext(null)

const LS_PLACES    = 'al-aseo:places'
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

export function AdminProvider({ children }) {
  // admin: { id, provider, nickname, email, avatar, isAdmin } | null
  // sessionLoading: /api/me 첫 응답 전까지 true. 게이트 화면 표시에 사용.
  // sessionError: 'not_admin' | 'unauthenticated' | null
  const [admin, setAdmin] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState(null)

  // 장소/지역/카테고리는 일단 localStorage 그대로 (6c에서 DB API로 전환 예정)
  const [places, setPlaces] = useState(() => readLS(LS_PLACES, INITIAL_PLACES))
  const [regions, setRegions] = useState(() => readLS(LS_REGIONS, INITIAL_REGIONS))
  const [categories, setCategories] = useState(() => readLS(LS_CATS, INITIAL_CATEGORIES))

  useEffect(() => { writeLS(LS_PLACES, places) }, [places])
  useEffect(() => { writeLS(LS_REGIONS, regions) }, [regions])
  useEffect(() => { writeLS(LS_CATS, categories) }, [categories])

  // 마운트 시 서버 세션 확인. /api/me는 is_admin=1이어야 200.
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

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch { /* noop */ }
    setAdmin(null)
    setSessionError('unauthenticated')
  }

  // ── 장소 CRUD (6c에서 DB로 전환 예정) ──
  function createPlace(data) {
    const newPlace = {
      id: `p_${Date.now()}`,
      reviewCount: 0,
      rating: data.rating ?? 4.0,
      tags: data.tags ?? [],
      ...data,
    }
    setPlaces(prev => [newPlace, ...prev])
    return newPlace
  }
  function updatePlace(id, updates) {
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }
  function deletePlace(id) {
    setPlaces(prev => prev.filter(p => p.id !== id))
  }

  // ── 지역 CRUD ──
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
      places, createPlace, updatePlace, deletePlace,
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
