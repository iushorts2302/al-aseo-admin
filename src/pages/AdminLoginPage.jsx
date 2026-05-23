import { useAdmin } from '../context/AdminContext'

export default function AdminLoginPage() {
  const { sessionError, logout } = useAdmin()
  const notAdmin = sessionError === 'not_admin'

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
         style={{ background: '#FAFAFC' }}>
      <div className="w-100" style={{ maxWidth: 400, padding: '0 16px' }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-1" style={{ color: '#0D6EFD' }}>Al-Aseo Admin</h2>
          <p className="text-muted small mb-0">관리자 전용</p>
        </div>
        <div className="card shadow-sm">
          <div className="card-body p-4">
            {notAdmin ? (
              <div>
                <div className="alert alert-warning small">
                  <strong>접근 권한이 없습니다.</strong><br />
                  이 계정은 관리자 권한이 없습니다.
                  관리자 권한이 필요한 경우 다른 관리자에게 문의하세요.
                </div>
                <button className="btn btn-outline-secondary w-100" onClick={logout}>
                  로그아웃하고 다른 계정으로
                </button>
              </div>
            ) : (
              <>
                <p className="small text-muted mb-3 text-center">
                  관리자 계정으로 로그인하세요.
                </p>
                <a className="btn btn-warning w-100 mb-2"
                   href="/api/auth/kakao/start?returnTo=/"
                   style={{ textDecoration: 'none' }}>
                  💬 카카오로 로그인
                </a>
                <a className="btn btn-light border w-100"
                   href="/api/auth/google/start?returnTo=/"
                   style={{ textDecoration: 'none' }}>
                  🔍 Google로 로그인
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
