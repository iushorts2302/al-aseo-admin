// Vercel Functions용 MySQL 연결 헬퍼.
// 서버리스 환경에서는 함수 인스턴스가 짧게 살았다 죽으므로,
// 풀을 글로벌로 두면 idle 연결이 누적되어 Aiven 측 connection limit에 걸리기 쉽다.
// 따라서 1차 구현은 요청당 단발 connection. 트래픽 늘면 풀로 전환.
import mysql from 'mysql2/promise'

function readDbConfig() {
  const host     = process.env.DB_HOST
  const port     = Number(process.env.DB_PORT || 3306)
  const user     = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const database = process.env.DB_NAME
  const missing = []
  if (!host)     missing.push('DB_HOST')
  if (!user)     missing.push('DB_USER')
  if (!password) missing.push('DB_PASSWORD')
  if (!database) missing.push('DB_NAME')
  if (missing.length) {
    const err = new Error(`Missing env: ${missing.join(', ')}`)
    err.code = 'MISSING_ENV'
    throw err
  }
  return { host, port, user, password, database }
}

export async function getConnection() {
  const cfg = readDbConfig()
  return mysql.createConnection({
    ...cfg,
    charset: 'utf8mb4',
    // Aiven은 SSL 필수. CA 사슬은 LetsEncrypt/공개 CA라 검증 통과해야 하지만,
    // 처음에는 호환성을 위해 rejectUnauthorized:false로 시작.
    // 운영 안정화 후 Aiven의 CA를 환경변수로 받아서 검증 모드로 전환.
    ssl: { rejectUnauthorized: false },
    connectTimeout: 8000,
  })
}

/** 사용 패턴:
 *    const conn = await getConnection()
 *    try { ... } finally { await conn.end() }
 */
