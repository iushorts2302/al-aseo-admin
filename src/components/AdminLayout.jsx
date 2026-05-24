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

const MOBILE_BREAKPOINT = 768  // Bootstrap md

// 윈도우 너비를 직접 보고 모바일 여부 판단. Bootstrap 클래스에 의존 안 함.
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
    <header className="bg-white border-bottom py-2 px-3 d-flex justify-content-between align-items-center"
            style={{ position: 'sticky', top: 0, zIndex: 1040 }}>
      <div className="d-flex align-items-center gap-2">
        {isMobile && (
          <button type="button"
                  className="btn btn-light btn-sm"
                  onClick={onToggleSidebar}
                  aria-label="메뉴 열기"
                  style={{ position: 'relative', zIndex: 1041 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
          </button>
        )}
        <h5 className="mb-0 fw-bold" style={{ color: 'var(--bs-primary)', cursor: 'pointer' }}
            onClick={() => navigate('dashboard')}>
          Al-Aseo Admin
        </h5>
      </div>
      <div className="d-flex align-items-center gap-2">
        {!isMobile && <span className="text-muted small">{admin?.nickname}</span>}
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => {
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
  // 데스크탑: 항상 inline 표시.
  // 모바일: open=true일 때만 fixed overlay로 표시.
  const visible = !isMobile || open

  function handleNavClick(id) {
    navigate(id)
    if (isMobile && onClose) onClose()
  }

  if (!visible) return null

  // 데스크탑: 좌측 고정 sidebar (relative flex item)
  // 모바일 open: fixed 오버레이 + 사이드바
  if (isMobile) {
    return (
      <>
        <div onClick={onClose}
             style={{
               position: 'fixed',
               inset: 0,
               background: 'rgba(0,0,0,0.4)',
               zIndex: 1045,
             }} />
        <aside className="bg-white border-end p-2"
               style={{
                 position: 'fixed',
                 top: 0,
                 left: 0,
                 width: 240,
                 height: '100vh',
                 zIndex: 1050,
                 paddingTop: 16,
                 boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
                 overflowY: 'auto',
               }}>
          <nav className="d-flex flex-column gap-1">
            {NAV_ITEMS.map(item => (
              <button key={item.id}
                type="button"
                className={`btn text-start ${currentPage === item.id ? 'btn-primary' : 'btn-light'}`}
                onClick={() => handleNavClick(item.id)}>
                <span className="me-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
      </>
    )
  }

  // 데스크탑
  return (
    <aside className="bg-white border-end p-2"
           style={{ width: 240, minHeight: 'calc(100vh - 56px)' }}>
      <nav className="d-flex flex-column gap-1">
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            type="button"
            className={`btn text-start ${currentPage === item.id ? 'btn-primary' : 'btn-light'}`}
            onClick={() => handleNavClick(item.id)}>
            <span className="me-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
