import { useState } from 'react'
import { Solar } from 'lunar-typescript'

// 정규화된 음력 결과 (A/B 비교용 공통 형태)
type Lunar = { year: number; month: number; day: number; leap: boolean }

// A: KASI 백엔드 (서버 proxy -> data.go.kr)
async function convertKasi(y: number, m: number, d: number): Promise<Lunar> {
  let res: Response
  try {
    res = await fetch(`/api/lunar?year=${y}&month=${m}&day=${d}`)
  } catch {
    throw new Error('서버(:8000)에 연결할 수 없음 — 서버 켜졌는지 확인')
  }
  // 서버 다운·502면 빈 바디라 json() 파싱이 터짐 → 먼저 상태 확인해 원인 명시
  const data = await res.json().catch(() => {
    throw new Error(`서버 응답 없음 (HTTP ${res.status}) — 서버 켜졌는지 확인`)
  })
  if (!res.ok) throw new Error(data.error ?? `KASI 변환 실패 (HTTP ${res.status})`)
  return {
    year: Number(data.lunar.year),
    month: Number(data.lunar.month),
    day: Number(data.lunar.day),
    leap: data.lunar.leapMonth,
  }
}

// B: lunar-typescript (클라이언트, 오프라인). 윤달이면 getMonth()가 음수.
function convertLib(y: number, m: number, d: number): Lunar {
  const lunar = Solar.fromYmd(y, m, d).getLunar()
  const rawMonth = lunar.getMonth()
  return {
    year: lunar.getYear(),
    month: Math.abs(rawMonth),
    day: lunar.getDay(),
    leap: rawMonth < 0,
  }
}

const fmt = (l: Lunar) =>
  `${l.year}-${String(l.month).padStart(2, '0')}-${String(l.day).padStart(2, '0')}${
    l.leap ? ' (윤달)' : ''
  }`

const same = (a: Lunar, b: Lunar) =>
  a.year === b.year && a.month === b.month && a.day === b.day && a.leap === b.leap

export default function LunarAB() {
  const [birth, setBirth] = useState('') // yyyy-mm-dd
  const [kasi, setKasi] = useState<Lunar | null>(null)
  const [lib, setLib] = useState<Lunar | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function run(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setKasi(null)
    setLib(null)

    const [ys, ms, ds] = birth.split('-')
    const y = Number(ys)
    const m = Number(ms)
    const d = Number(ds)
    if (!y || !m || !d) {
      setError('생년월일을 입력하세요.')
      return
    }

    // B(lib)는 동기·오프라인 -> 먼저 표시
    setLib(convertLib(y, m, d))

    setLoading(true)
    try {
      setKasi(await convertKasi(y, m, d))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const match = kasi && lib ? same(kasi, lib) : null

  return (
    <div style={{ border: '1px dashed #888', padding: 16, margin: 16 }}>
      <h2>음력 변환 A/B (KASI vs lunar-typescript)</h2>
      <form onSubmit={run}>
        <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
        <button type="submit" disabled={loading}>
          {loading ? '변환 중...' : '비교'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <ul>
        <li>A · KASI: {kasi ? fmt(kasi) : loading ? '...' : '-'}</li>
        <li>B · lib: {lib ? fmt(lib) : '-'}</li>
      </ul>

      {match !== null && (
        <p style={{ color: match ? 'green' : 'crimson', fontWeight: 'bold' }}>
          {match ? '일치' : '불일치'}
        </p>
      )}
    </div>
  )
}
