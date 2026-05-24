import { useAdmin } from '../context/AdminContext'

const NAV_ITEMS = [
  { id: 'dashboard',  label: '대시보드',   icon: '📊' },
  { id: 'regions',    label: '지역 관리',  icon: '🌏' },
  { id: 'categories', label: '카테고리',   icon: '🏷️' },
  { id: 'places',     label: '장소 관리',  icon: '📍' },
  { id: 'users',      label: '사용자',     icon: '👥' },
  { id: 'trips',      label: '여행 계획',  icon: '🗺️' },
]

export function AdminHeader({ navigate, onToggleSidebar }) {
  const { admin, logout } = useAdmin()
  return (
    <header className="admin-header bg-white border-bottom py-2 px-3 d-flex justify-content-between align-items-center"
            style={{ position: 'sticky', top: 0, zIndex: 1040 }}>
      <div className="d-flex align-items-center gap-2">
        {/* 햄버거: 좁은 화면(md 미만)에서만 표시 */}
        <button className="btn btn-light btn-sm d-md-none"
                onClick={onToggleSidebar}
                aria-label="메뉴 열기">
          <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
        </button>
        <h5 className="mb-0 fw-bold" style={{ color: 'var(--bs-primary)', cursor: 'pointer' }}
            onClick={() => navigate('dashboard')}>
          Al-Aseo Admin
        </h5>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small d-none d-sm-inline">{admin?.nickname}</span>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => {
          if (confirm('로그아웃 하시겠어요?')) logout()
        }}>
          로그아웃
        </button>
      </div>
    </header>
  )
}

export function AdminSidebar({ currentPage, navigate, open, onClose }) {
  // 메뉴 클릭 시: 페이지 전환 + 모바일에선 사이드바 자동 닫힘
  function handleNavClick(id) {
    navigate(id)
    if (onClose) onClose()
  }

  return (
    <>
      {/* 모바일 오버레이: open일 때만 표시, 클릭 시 닫힘 */}
      {open && (
        <div className="d-md-none"
             onClick={onClose}
             style={{
               position: 'fixed',
               inset: 0,
               background: 'rgba(0,0,0,0.4)',
               zIndex: 1045,
             }} />
      )}
      {/* 사이드바
          - 데스크탑(md 이상): 항상 보임, 좌측 고정 200px
          - 모바일(md 미만): open=true일 때만 슬라이드 표시 */}
      <aside className={`admin-sidebar bg-white border-end p-2 ${open ? '' : 'd-none d-md-block'}`}
             style={{
               width: 240,
               minHeight: 'calc(100vh - 56px)',
               // 모바일에선 fixed overlay, 데스크탑에선 inline flex 아이템
               // 좁은 화면일 때 z-index로 오버레이 위로 띄움
               ...(open ? {
                 position: 'fixed',
                 top: 0,
                 left: 0,
                 height: '100vh',
                 zIndex: 1050,
                 paddingTop: 16,
                 boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
               } : {}),
             }}>
        <nav className="d-flex flex-column gap-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id}
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
