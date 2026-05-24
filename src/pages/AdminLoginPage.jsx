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
