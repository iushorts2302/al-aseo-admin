// OAuth flow의 state 파라미터 보호용 단기 JWT.
// 5분 짜리. 콜백 시 검증 + nonce 1회 사용 보장은 nonce field에 의존.
import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'al_oauth_state'
const ALG = 'HS256'
const TTL_SECONDS = 60 * 5  // 5분

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET not configured')
  return new TextEncoder().encode(s)
}

/** payload: { provider, nonce, returnTo? } */
export async function signStateJwt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getSecret())
}

export async function verifyStateJwt(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] })
    return payload
  } catch {
    return null
  }
}

export const STATE_COOKIE_NAME = COOKIE_NAME
export const STATE_TTL = TTL_SECONDS
