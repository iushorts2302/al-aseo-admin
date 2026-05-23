// API 핸들러 공통 유틸: 인증 필수 래퍼.
import { getUserFromRequest } from './session.js'

/** 요청에 세션이 있을 때만 핸들러 실행. 없으면 401. */
export function requireAuth(handler) {
  return async (req, res) => {
    const session = await getUserFromRequest(req)
    if (!session) return res.status(401).json({ error: 'unauthenticated' })
    req.user = session  // { sub: userId, provider, nickname }
    return handler(req, res)
  }
}

/** Vercel Functions에서 method allow 응답. */
export function methodNotAllowed(res, allow) {
  res.setHeader('Allow', allow)
  return res.status(405).json({ error: 'method_not_allowed' })
}
