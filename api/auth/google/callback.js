// GET /api/auth/google/callback?code=...&state=...
// 1) state 쿠키 vs query.state 검증 (CSRF)
// 2) code → access_token + id_token 교환
// 3) id_token에서 프로필 추출
// 4) DB upsert
// 5) 세션 쿠키 발급
// 6) returnTo로 리다이렉트
import { parse, serialize } from 'cookie'
import { decodeJwt } from 'jose'
import { verifyStateJwt, STATE_COOKIE_NAME } from '../../_lib/oauth-state.js'
import { signSessionJwt, buildSessionCookie } from '../../_lib/session.js'
import { getConnection } from '../../_lib/db.js'
import { upsertUserByProvider } from '../../_lib/users.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { code, state, error: oauthErr } = req.query || {}
  if (oauthErr) {
    return redirectWithError(res, `/?login_error=${encodeURIComponent(oauthErr)}`)
  }
  if (!code || !state) {
    return redirectWithError(res, '/?login_error=missing_params')
  }

  // 1) state 검증
  const cookieHeader = req.headers.cookie || ''
  const cookies = parse(cookieHeader)
  const stateCookie = cookies[STATE_COOKIE_NAME]
  if (!stateCookie || stateCookie !== state) {
    return redirectWithError(res, '/?login_error=state_mismatch')
  }
  const stateData = await verifyStateJwt(state)
  if (!stateData || stateData.provider !== 'google') {
    return redirectWithError(res, '/?login_error=invalid_state')
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return redirectWithError(res, '/?login_error=server_misconfigured')
  }

  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim()
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const redirectUri = `${proto}://${host}/api/auth/google/callback`

  // 2) code → token
  let tokenJson
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    tokenJson = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error('google token exchange failed', tokenJson)
      return redirectWithError(res, '/?login_error=token_exchange_failed')
    }
  } catch (err) {
    console.error('google token fetch error', err)
    return redirectWithError(res, '/?login_error=token_fetch_error')
  }

  // 3) id_token에서 프로필 추출.
  //    프로덕션에선 서명 검증까지 해야 하지만, code가 우리 client_secret으로 받은 것이라
  //    Google에서 직접 받은 응답이라는 확신이 있으므로 일단 decode만.
  if (!tokenJson.id_token) {
    return redirectWithError(res, '/?login_error=no_id_token')
  }
  const profile = decodeJwt(tokenJson.id_token)
  // profile: { sub, email, email_verified, name, picture, ... }

  // 4) DB upsert + superadmin 권한 확인
  let conn
  let user
  let isSuperadmin = false
  try {
    conn = await getConnection()
    user = await upsertUserByProvider(conn, {
      provider: 'google',
      providerUid: String(profile.sub),
      email: profile.email || null,
      nickname: profile.name || profile.email?.split('@')[0] || '여행자',
      avatar: profile.picture || null,
    })
    // 슈퍼관리자 화이트리스트 체크. 관리자 웹은 superadmin만 진입 가능.
    const [rows] = await conn.query(
      'SELECT is_superadmin FROM users WHERE id = ?',
      [user.id],
    )
    isSuperadmin = rows.length > 0 && !!rows[0].is_superadmin
  } catch (err) {
    console.error('user upsert failed', err)
    return redirectWithError(res, '/?login_error=db_error')
  } finally {
    if (conn) {
      try { await conn.end() } catch { /* noop */ }
    }
  }

  // 4-1) 슈퍼관리자가 아니면 세션 발급 거부 (user는 DB에 남아 있음 — 사용자 웹은 사용 가능)
  if (!isSuperadmin) {
    const clearState = serialize(STATE_COOKIE_NAME, '', {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0,
    })
    res.setHeader('Set-Cookie', clearState)
    res.setHeader('Location', '/?login_error=not_superadmin')
    return res.status(302).end()
  }

  // 5) 세션 쿠키 발급 (state 쿠키는 만료시킴)
  const sessionToken = await signSessionJwt({
    sub: user.id,
    provider: 'google',
    nickname: user.nickname,
  })
  const clearState = serialize(STATE_COOKIE_NAME, '', {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0,
  })
  res.setHeader('Set-Cookie', [buildSessionCookie(sessionToken), clearState])

  // 6) returnTo로
  const target = stateData.returnTo && stateData.returnTo.startsWith('/')
    ? stateData.returnTo
    : '/'
  res.setHeader('Location', target + (target.includes('?') ? '&' : '?') + 'logged_in=1')
  return res.status(302).end()
}

function redirectWithError(res, location) {
  res.setHeader('Location', location)
  return res.status(302).end()
}
