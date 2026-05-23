import { useState } from 'react'
import { AdminProvider, useAdmin } from './context/AdminContext'
import { AdminHeader, AdminSidebar } from './components/AdminLayout'
import AdminLoginPage from './pages/AdminLoginPage'
import {
  DashboardPage, RegionManager, CategoryManager,
  PlaceManager, UserManager, TripManager,
} from './pages/AdminPages'

function AdminApp() {
  const { admin, sessionLoading } = useAdmin()
  const [page, setPage] = useState('dashboard')

  // 세션 확인 중 — 깜박임 방지용 빈 화면
  if (sessionLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
           style={{ background: '#FAFAFC' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // 비로그인 또는 비관리자 → 로그인 페이지 (안의 분기로 에러도 보여줌)
  if (!admin) return <AdminLoginPage />

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <DashboardPage />
      case 'regions':    return <RegionManager />
      case 'categories': return <CategoryManager />
      case 'places':     return <PlaceManager />
      case 'users':      return <UserManager />
      case 'trips':      return <TripManager />
      default:           return <DashboardPage />
    }
  }

  return (
    <div className="admin-root">
      <AdminHeader navigate={setPage} />
      <div className="d-flex">
        <AdminSidebar currentPage={page} navigate={setPage} />
        <main style={{ flex: 1, minHeight: 'calc(100vh - 56px)', background: '#FAFAFC' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return <AdminProvider><AdminApp /></AdminProvider>
}
