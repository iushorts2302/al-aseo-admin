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
  // 모바일 사이드바 토글. 데스크탑(md 이상)에선 CSS가 사이드바 항상 표시.
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      <AdminHeader navigate={setPage}
                   onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <div className="d-flex">
        <AdminSidebar currentPage={page}
                      navigate={setPage}
                      open={sidebarOpen}
                      onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, minHeight: 'calc(100vh - 56px)', background: '#FAFAFC', minWidth: 0 }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return <AdminProvider><AdminApp /></AdminProvider>
}
