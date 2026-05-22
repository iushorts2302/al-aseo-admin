import { useState } from 'react'
import { AdminProvider, useAdmin } from './context/AdminContext'
import { AdminHeader, AdminSidebar } from './components/AdminLayout'
import AdminLoginPage from './pages/AdminLoginPage'
import {
  DashboardPage, RegionManager, CategoryManager,
  PlaceManager, UserManager, TripManager,
} from './pages/AdminPages'

function AdminApp() {
  const { admin } = useAdmin()
  const [page, setPage] = useState('dashboard')

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
