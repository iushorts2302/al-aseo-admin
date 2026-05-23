// OAuth provider profile로 users 테이블에 upsert.
// 같은 (provider, provider_uid)면 동일 유저로 인식.
import crypto from 'node:crypto'

export async function upsertUserByProvider(conn, { provider, providerUid, email, nickname, avatar }) {
  // 1) 기존 유저 찾기
  const [existing] = await conn.query(
    'SELECT id, email, nickname, avatar FROM users WHERE provider = ? AND provider_uid = ?',
    [provider, providerUid],
  )
  if (existing.length > 0) {
    const u = existing[0]
    // 이메일/닉네임/아바타가 OAuth 쪽에서 변경됐다면 동기화 (값이 있을 때만)
    const updates = []
    const params = []
    if (email && email !== u.email)             { updates.push('email = ?');    params.push(email) }
    if (nickname && nickname !== u.nickname)    { updates.push('nickname = ?'); params.push(nickname) }
    if (avatar && avatar !== u.avatar)          { updates.push('avatar = ?');   params.push(avatar) }
    if (updates.length > 0) {
      params.push(u.id)
      await conn.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
    }
    return { id: u.id, email: email || u.email, nickname: nickname || u.nickname, avatar: avatar || u.avatar, isNew: false }
  }

  // 2) 신규 생성
  const id = `u_${crypto.randomBytes(8).toString('hex')}`
  await conn.query(
    'INSERT INTO users (id, provider, provider_uid, email, nickname, avatar) VALUES (?, ?, ?, ?, ?, ?)',
    [id, provider, providerUid, email || null, nickname || '여행자', avatar || null],
  )
  return { id, email, nickname: nickname || '여행자', avatar, isNew: true }
}
