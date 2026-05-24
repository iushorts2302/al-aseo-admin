import { useState, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'

const NAV_ITEMS = [
  { id: 'dashboard',  label: '대시보드',   icon: '📊' },
  { id: 'regions',    label: '지역 관리',  icon: '🌏' },
  { id: 'categories', label: '카테고리',   icon: '🏷️' },
  { id: 'places',     label: '장소 관리',  icon: '📍' },
  { id: 'users',      label: '사용자',     icon: '👥' },
  { id: 'trips',      label: '여행 계획',  icon: '🗺️' },
]

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  ))
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

export function AdminHeader({ navigate, onToggleSidebar }) {
  const { admin, logout } = useAdmin()
  const isMobile = useIsMobile()
  return (
    <header className="bg-white py-2 px-3 d-flex justify-content-between align-items-center"
            style={{ position: 'sticky', top: 0, zIndex: 1040, minHeight: 56 }}>
      <div className="d-flex align-items-center gap-2">
        {isMobile && (
          <button type="button"
                  className="btn btn-light btn-sm"
                  onClick={onToggleSidebar}
                  aria-label="메뉴 열기"
                  style={{ position: 'relative', zIndex: 1041, padding: '0.375rem 0.625rem' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
          </button>
        )}
        <div className="d-flex align-items-center gap-2"
             style={{ cursor: 'pointer' }}
             onClick={() => navigate('dashboard')}>
          {/* Tabler 스타일 로고 마크 */}
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--tabler-primary)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em',
          }}>A</div>
          <span className="fw-bold" style={{ fontSize: '1rem', color: 'var(--tabler-text)' }}>
            Al-Aseo Admin
          </span>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2">
        {!isMobile && (
          <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
            {admin?.nickname}
          </span>
        )}
        <button type="button"
                className="btn btn-light btn-sm"
                onClick={() => {
                  if (confirm('로그아웃 하시겠어요?')) logout()
                }}>
          로그아웃
        </button>
      </div>
    </header>
  )
}

export function AdminSidebar({ currentPage, navigate, open, onClose }) {
  const isMobile = useIsMobile()
  const visible = !isMobile || open

  function handleNavClick(id) {
    navigate(id)
    if (isMobile && onClose) onClose()
  }

  if (!visible) return null

  // 메뉴 그룹 라벨 추가 — Tabler 느낌
  const sidebarBody = (
    <>
      <div className="text-muted px-2 mb-2 mt-2"
           style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        메뉴
      </div>
      <nav className="d-flex flex-column gap-1">
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            type="button"
            className={`btn text-start ${currentPage === item.id ? 'btn-primary' : ''}`}
            onClick={() => handleNavClick(item.id)}>
            <span className="me-2" style={{ fontSize: '1rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </>
  )

  if (isMobile) {
    return (
      <>
        <div onClick={onClose}
             style={{
               position: 'fixed',
               inset: 0,
               background: 'rgba(35,49,68,0.4)',
               zIndex: 1045,
             }} />
        <aside className="admin-sidebar bg-white p-3"
               style={{
                 position: 'fixed',
                 top: 0,
                 left: 0,
                 width: 260,
                 height: '100vh',
                 zIndex: 1050,
                 boxShadow: '4px 0 16px rgba(35,49,68,0.18)',
                 overflowY: 'auto',
                 borderRight: '1px solid var(--tabler-border)',
               }}>
          {sidebarBody}
        </aside>
      </>
    )
  }

  return (
    <aside className="admin-sidebar bg-white p-3"
           style={{
             width: 240,
             minHeight: 'calc(100vh - 56px)',
             borderRight: '1px solid var(--tabler-border)',
             flexShrink: 0,
           }}>
      {sidebarBody}
    </aside>
  )
}
