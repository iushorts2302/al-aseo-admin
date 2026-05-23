// 세션 JWT 발급/검증 + 쿠키 헬퍼.
// httpOnly 쿠키로 세션을 운반하여 JS에서 토큰을 직접 읽지 못하게 함(XSS 방어).
import { SignJWT, jwtVerify } from 'jose'
import { serialize, parse } from 'cookie'

const COOKIE_NAME = 'al_session'
const ALG = 'HS256'
const TTL_SECONDS = 60 * 60 * 24 * 7  // 7일

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET not configured')
  return new TextEncoder().encode(s)
}

/** payload = { sub: userId, provider, nickname } */
export async function signSessionJwt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getSecret())
}

export async function verifySessionJwt(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] })
    return payload
  } catch {
    return null
  }
}

/** Set-Cookie 헤더 값 생성 */
export function buildSessionCookie(token) {
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_SECONDS,
  })
}

/** 만료 쿠키 (logout용) */
export function buildClearCookie() {
  return serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/** 요청 헤더에서 세션 토큰 추출 */
export function getSessionTokenFromReq(req) {
  const cookieHeader = req.headers.cookie || ''
  const parsed = parse(cookieHeader)
  return parsed[COOKIE_NAME] || null
}

/** 요청에서 현재 사용자 payload 가져오기 (없거나 무효면 null) */
export async function getUserFromRequest(req) {
  const token = getSessionTokenFromReq(req)
  if (!token) return null
  return await verifySessionJwt(token)
}
