// GET /api/auth/google/start
// state JWT 쿠키 발급 후 Google OAuth 동의 화면으로 302.
import crypto from 'node:crypto'
import { serialize } from 'cookie'
import { signStateJwt, STATE_COOKIE_NAME, STATE_TTL } from '../../_lib/oauth-state.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return res.status(500).json({ error: 'google_not_configured' })

  // returnTo는 단순 안전 검증만: 같은 호스트의 상대 경로만 허용
  let returnTo = '/'
  if (typeof req.query?.returnTo === 'string' && req.query.returnTo.startsWith('/')) {
    returnTo = req.query.returnTo
  }

  const nonce = crypto.randomBytes(16).toString('hex')
  const stateToken = await signStateJwt({ provider: 'google', nonce, returnTo })

  // state 쿠키 (콜백에서 검증)
  const stateCookie = serialize(STATE_COOKIE_NAME, stateToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_TTL,
  })

  // 호스트로부터 redirect_uri 동적 생성
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim()
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const redirectUri = `${proto}://${host}/api/auth/google/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: stateToken,
    access_type: 'online',
    prompt: 'select_account',
  })
  const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  res.setHeader('Set-Cookie', stateCookie)
  res.setHeader('Location', authorizeUrl)
  return res.status(302).end()
}
