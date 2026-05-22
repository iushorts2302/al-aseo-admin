import { useAdmin } from '../context/AdminContext'

const NAV_ITEMS = [
  { id: 'dashboard',  label: '대시보드',   icon: '📊' },
  { id: 'regions',    label: '지역 관리',  icon: '🌏' },
  { id: 'categories', label: '카테고리',   icon: '🏷️' },
  { id: 'places',     label: '장소 관리',  icon: '📍' },
  { id: 'users',      label: '사용자',     icon: '👥' },
  { id: 'trips',      label: '여행 계획',  icon: '🗺️' },
]

export function AdminHeader({ navigate }) {
  const { admin, logout } = useAdmin()
  return (
    <header className="admin-header bg-white border-bottom py-2 px-3 d-flex justify-content-between align-items-center"
            style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="d-flex align-items-center gap-3">
        <h5 className="mb-0 fw-bold" style={{ color: 'var(--bs-primary)', cursor: 'pointer' }}
            onClick={() => navigate('dashboard')}>
          Al-Aseo Admin
        </h5>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small">{admin?.nickname}</span>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => {
          if (confirm('로그아웃 하시겠어요?')) logout()
        }}>
          로그아웃
        </button>
      </div>
    </header>
  )
}

export function AdminSidebar({ currentPage, navigate }) {
  return (
    <aside className="admin-sidebar bg-white border-end p-2"
           style={{ width: 200, minHeight: 'calc(100vh - 56px)' }}>
      <nav className="d-flex flex-column gap-1">
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            className={`btn text-start ${currentPage === item.id ? 'btn-primary' : 'btn-light'}`}
            onClick={() => navigate(item.id)}>
            <span className="me-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
