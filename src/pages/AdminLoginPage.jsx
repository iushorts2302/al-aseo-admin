import { useState, useRef, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'

export default function AdminLoginPage() {
  const { sessionError, logout, demoLogin } = useAdmin()
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const [demoError, setDemoError] = useState('')
  const [demoSubmitting, setDemoSubmitting] = useState(false)
  // OAuth callback이 거부 시 ?login_error=not_superadmin 붙여서 돌려보냄
  const [oauthError, setOauthError] = useState(null)
  const notAdmin = sessionError === 'not_admin'

  // URL의 login_error 감지 후 state로 옮기고 URL 정리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('login_error')
    if (err) {
      setOauthError(err)
      const newSearch = new URLSearchParams(window.location.search)
      newSearch.delete('login_error')
      const newUrl = window.location.pathname +
        (newSearch.toString() ? '?' + newSearch.toString() : '') +
        window.location.hash
      window.history.replaceState(null, '', newUrl)
    }
  }, [])

  // form submit 대신 button onClick 직접 호출. 일부 환경에서 form onSubmit이
  // 안 잡히는 케이스를 우회. uncontrolled input + ref로 autofill 대응.
  async function handleDemoLogin() {
    const email = emailRef.current?.value?.trim() || ''
    const password = passwordRef.current?.value || ''
    if (!email || !password) {
      setDemoError('이메일과 비밀번호를 모두 입력하세요.')
      return
    }
    setDemoError('')
    setDemoSubmitting(true)
    try {
      await demoLogin(email, password)
      // 성공 시 admin이 세팅되므로 자동 대시보드 전환
    } catch (err) {
      setDemoError(err.message || '로그인에 실패했습니다.')
    } finally {
      setDemoSubmitting(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
         style={{ background: 'var(--tabler-bg)' }}>
      <div className="w-100" style={{ maxWidth: 400, padding: '0 16px' }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-1" style={{ color: 'var(--tabler-primary)' }}>Al-Aseo Admin</h2>
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
                {/* 항상 표시 — OAuth 진입 정책 안내 */}
                <div className="mb-3 p-2 rounded" style={{
                  background: 'rgba(66,153,225,0.10)',
                  border: '1px solid rgba(66,153,225,0.20)',
                  fontSize: '0.75rem',
                  color: '#1b5a8a',
                }}>
                  ℹ️ <strong>카카오·구글 로그인은 사전 등록된 관리자만 가능합니다.</strong><br />
                  접근이 필요하면 슈퍼관리자에게 문의하세요.
                </div>

                {/* OAuth callback 거부 시 (사전 등록되지 않은 계정) */}
                {oauthError === 'not_superadmin' && (
                  <div className="alert alert-danger py-2 small mb-3">
                    <strong>이 계정은 관리자 권한이 없습니다.</strong><br />
                    등록된 슈퍼관리자만 접근 가능합니다.
                  </div>
                )}
                {/* 그 외 OAuth 실패 (state mismatch, token fail 등) */}
                {oauthError && oauthError !== 'not_superadmin' && (
                  <div className="alert alert-warning py-2 small mb-3">
                    로그인 처리 중 문제가 발생했습니다. ({oauthError})
                  </div>
                )}

                {/* 데모 계정 로그인 (시연용). form 없이 button onClick */}
                <div className="mb-2">
                  <label className="form-label small fw-semibold mb-1">데모 계정 이메일</label>
                  <input ref={emailRef}
                         className="form-control form-control-sm" type="email"
                         placeholder="admin@al-aseo.com"
                         defaultValue=""
                         autoComplete="username"
                         disabled={demoSubmitting}
                         onKeyDown={e => { if (e.key === 'Enter') handleDemoLogin() }} />
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold mb-1">비밀번호</label>
                  <input ref={passwordRef}
                         className="form-control form-control-sm" type="password"
                         defaultValue=""
                         autoComplete="current-password"
                         disabled={demoSubmitting}
                         onKeyDown={e => { if (e.key === 'Enter') handleDemoLogin() }} />
                </div>
                {demoError && <div className="alert alert-danger py-1 small mb-2">{demoError}</div>}
                <button type="button"
                        className="btn btn-primary w-100 btn-sm"
                        onClick={handleDemoLogin}
                        disabled={demoSubmitting}>
                  {demoSubmitting ? '로그인 중...' : '데모 계정으로 로그인'}
                </button>

                {/* 데모 계정 정보 안내 (시연용) */}
                <div className="mt-3 p-2 rounded" style={{
                  background: 'var(--tabler-bg)',
                  border: '1px solid var(--tabler-border)',
                  fontSize: '0.75rem',
                }}>
                  <div className="fw-semibold mb-1" style={{ color: 'var(--tabler-text)' }}>
                    데모 계정
                  </div>
                  <div className="text-muted">
                    admin@al-aseo.com · admin1234
                  </div>
                </div>

                <div className="text-center text-muted small my-3" style={{ position: 'relative' }}>
                  <hr style={{ margin: 0 }} />
                  <span style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white', padding: '0 8px',
                  }}>또는</span>
                </div>

                <a className="oauth-btn oauth-btn--kakao"
                   href="/api/auth/kakao/start?returnTo=/"
                   style={{ marginBottom: 10 }}>
                  <svg className="oauth-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#191600" d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.34 4.65 6.77l-1.18 4.32c-.1.36.29.65.6.45L11.27 19c.24.02.48.03.73.03 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                  </svg>
                  카카오로 로그인
                </a>
                <a className="oauth-btn oauth-btn--google"
                   href="/api/auth/google/start?returnTo=/">
                  <svg className="oauth-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 로그인
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
