// GET /api/auth/kakao/callback?code=...&state=...
// 1) state 검증 (CSRF)
// 2) code → access_token (kauth.kakao.com/oauth/token)
// 3) access_token으로 /v2/user/me 호출 → 프로필 (id, kakao_account.email, properties.nickname/profile_image)
// 4) DB upsert (이메일 없을 수 있음에 주의)
// 5) 세션 쿠키 발급
// 6) returnTo로 리다이렉트
import { parse, serialize } from 'cookie'
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
  const cookies = parse(req.headers.cookie || '')
  const stateCookie = cookies[STATE_COOKIE_NAME]
  if (!stateCookie || stateCookie !== state) {
    return redirectWithError(res, '/?login_error=state_mismatch')
  }
  const stateData = await verifyStateJwt(state)
  if (!stateData || stateData.provider !== 'kakao') {
    return redirectWithError(res, '/?login_error=invalid_state')
  }

  const clientId = process.env.KAKAO_REST_API_KEY
  const clientSecret = process.env.KAKAO_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return redirectWithError(res, '/?login_error=server_misconfigured')
  }

  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim()
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const redirectUri = `${proto}://${host}/api/auth/kakao/callback`

  // 2) code → access_token
  let tokenJson
  try {
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: String(code),
      }),
    })
    tokenJson = await tokenRes.json()
    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error('kakao token exchange failed', tokenJson)
      return redirectWithError(res, '/?login_error=token_exchange_failed')
    }
  } catch (err) {
    console.error('kakao token fetch error', err)
    return redirectWithError(res, '/?login_error=token_fetch_error')
  }

  // 3) /v2/user/me로 프로필 조회
  let profile
  try {
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    })
    profile = await profileRes.json()
    if (!profileRes.ok || !profile.id) {
      console.error('kakao profile fetch failed', profile)
      return redirectWithError(res, '/?login_error=profile_fetch_failed')
    }
  } catch (err) {
    console.error('kakao profile fetch error', err)
    return redirectWithError(res, '/?login_error=profile_fetch_error')
  }

  // 카카오 응답 형태:
  // { id: 12345, kakao_account: { email?, profile: { nickname, profile_image_url } } }
  // properties도 있지만 deprecated 가는 추세라 kakao_account.profile 우선.
  const account = profile.kakao_account || {}
  const kakProfile = account.profile || {}
  const email = account.email || null  // 사용자가 동의하지 않으면 없음
  const nickname = kakProfile.nickname || profile.properties?.nickname || '카카오 사용자'
  const avatar = kakProfile.profile_image_url || profile.properties?.profile_image || null

  // 4) DB upsert + superadmin 권한 확인
  let conn
  let user
  let isSuperadmin = false
  try {
    conn = await getConnection()
    user = await upsertUserByProvider(conn, {
      provider: 'kakao',
      providerUid: String(profile.id),
      email,
      nickname,
      avatar,
    })
    const [rows] = await conn.query(
      'SELECT is_superadmin FROM users WHERE id = ?',
      [user.id],
    )
    isSuperadmin = rows.length > 0 && !!rows[0].is_superadmin
  } catch (err) {
    console.error('kakao user upsert failed', err)
    return redirectWithError(res, '/?login_error=db_error')
  } finally {
    if (conn) {
      try { await conn.end() } catch { /* noop */ }
    }
  }

  // 4-1) 슈퍼관리자 아니면 거부
  if (!isSuperadmin) {
    const clearState = serialize(STATE_COOKIE_NAME, '', {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0,
    })
    res.setHeader('Set-Cookie', clearState)
    res.setHeader('Location', '/?login_error=not_superadmin')
    return res.status(302).end()
  }

  // 5) 세션 쿠키 발급, state 쿠키 만료
  const sessionToken = await signSessionJwt({
    sub: user.id,
    provider: 'kakao',
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
