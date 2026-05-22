import { createContext, useContext, useState, useEffect } from 'react'
import {
  PLACES as INITIAL_PLACES,
  REGIONS as INITIAL_REGIONS,
  CATEGORIES as INITIAL_CATEGORIES,
} from '../data/places.js'

const AdminContext = createContext(null)

const LS_ADMIN     = 'al-aseo:admin'
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

// 데모 관리자 계정 — UI 표시용
const ADMIN_ACCOUNT = {
  email: 'admin@al-aseo.com',
  password: 'admin1234',
  nickname: '관리자',
  role: 'admin',
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => readLS(LS_ADMIN, null))
  const [places, setPlaces] = useState(() => readLS(LS_PLACES, INITIAL_PLACES))
  const [regions, setRegions] = useState(() => readLS(LS_REGIONS, INITIAL_REGIONS))
  const [categories, setCategories] = useState(() => readLS(LS_CATS, INITIAL_CATEGORIES))

  useEffect(() => { writeLS(LS_PLACES, places) }, [places])
  useEffect(() => { writeLS(LS_REGIONS, regions) }, [regions])
  useEffect(() => { writeLS(LS_CATS, categories) }, [categories])

  function login(email, password) {
    if (email !== ADMIN_ACCOUNT.email || password !== ADMIN_ACCOUNT.password) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    const session = { ...ADMIN_ACCOUNT, password: undefined }
    setAdmin(session)
    writeLS(LS_ADMIN, session)
  }

  function logout() {
    setAdmin(null)
    writeLS(LS_ADMIN, null)
  }

  // ── 장소 CRUD ──
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
      admin, login, logout,
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
