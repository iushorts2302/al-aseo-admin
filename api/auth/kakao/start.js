// GET /api/auth/kakao/start
// Kakao OAuth 동의 화면으로 302. state JWT는 쿠키 + state 쿼리 양쪽에 실어 CSRF 방어.
import crypto from 'node:crypto'
import { serialize } from 'cookie'
import { signStateJwt, STATE_COOKIE_NAME, STATE_TTL } from '../../_lib/oauth-state.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const clientId = process.env.KAKAO_REST_API_KEY
  if (!clientId) return res.status(500).json({ error: 'kakao_not_configured' })

  let returnTo = '/'
  if (typeof req.query?.returnTo === 'string' && req.query.returnTo.startsWith('/')) {
    returnTo = req.query.returnTo
  }

  const nonce = crypto.randomBytes(16).toString('hex')
  const stateToken = await signStateJwt({ provider: 'kakao', nonce, returnTo })

  const stateCookie = serialize(STATE_COOKIE_NAME, stateToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_TTL,
  })

  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim()
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const redirectUri = `${proto}://${host}/api/auth/kakao/callback`

  // 카카오는 scope를 디벨로퍼스 콘솔의 '동의 항목'에서 설정한 것에 맞춰 요청.
  // 이메일(account_email)은 비즈 앱 심사가 필요하므로 개인 앱에서는 미요청.
  // upsert 시 email은 NULL로 저장됨 (스키마 허용).
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'profile_nickname profile_image',
    state: stateToken,
  })
  const authorizeUrl = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`

  res.setHeader('Set-Cookie', stateCookie)
  res.setHeader('Location', authorizeUrl)
  return res.status(302).end()
}
