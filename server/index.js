import express from 'express'
import { XMLParser } from 'fast-xml-parser'

const app = express()
const PORT = process.env.PORT || 8000

const KASI_BASE =
  'https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService'
const SERVICE_KEY = process.env.KASI_SERVICE_KEY

// parseTagValue:false → "00", "01" 등 문자열 유지 (숫자 변환 시 leading-zero 손실·resultCode 오판)
const parser = new XMLParser({ parseTagValue: false })
const pad = (n) => String(n).padStart(2, '0')

// 음력 결과는 날짜별 불변 → 메모리 캐시. 같은 날짜 재조회 시 KASI 호출 0 (쿼터·속도 방어)
const cache = new Map()
const cacheKey = (y, m, d) => `${Number(y)}-${Number(m)}-${Number(d)}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const BACKOFF = [300, 800, 1600] // KASI 순간 스로틀·네트워크 흔들림 대비 재시도 대기(ms)

// KASI 조회 + 파싱 + 재시도. { status, body } 반환.
async function fetchLunar(year, month, day) {
  // serviceKey는 이미 URL-encoded 상태 → 재인코딩 금지, 문자열로 직접 붙임
  const url =
    `${KASI_BASE}/getLunCalInfo?serviceKey=${SERVICE_KEY}` +
    `&solYear=${year}&solMonth=${pad(month)}&solDay=${pad(day)}`

  let lastErr = { error: '변환 실패' }
  for (let attempt = 0; attempt <= BACKOFF.length; attempt++) {
    try {
      const parsed = parser.parse(await (await fetch(url)).text())
      const header = parsed?.response?.header
      if (header?.resultCode !== '00') {
        lastErr = { error: 'KASI 오류', code: header?.resultCode, msg: header?.resultMsg }
      } else {
        const item = parsed?.response?.body?.items?.item
        if (!item) return { status: 404, body: { error: '변환 결과 없음' } }
        return {
          status: 200,
          body: {
            solar: { year: Number(year), month: Number(month), day: Number(day) },
            lunar: {
              year: item.lunYear,
              month: item.lunMonth,
              day: item.lunDay,
              leapMonth: item.lunLeapmonth === '윤', // 평/윤
            },
            raw: item,
          },
        }
      }
    } catch (err) {
      lastErr = { error: '변환 실패', detail: String(err) }
    }
    if (attempt < BACKOFF.length) await sleep(BACKOFF[attempt]) // 재시도 전 대기
  }
  return { status: 502, body: lastErr } // 재시도 다 소진
}

// 양력 → 음력 변환
app.get('/api/lunar', async (req, res) => {
  const { year, month, day } = req.query
  if (!year || !month || !day) {
    return res.status(400).json({ error: 'year, month, day 필수' })
  }

  const key = cacheKey(year, month, day)
  if (cache.has(key)) {
    console.log(`입력 ${year}-${month}-${day} → (캐시)`)
    return res.json(cache.get(key))
  }

  const result = await fetchLunar(year, month, day)
  if (result.status === 200) {
    cache.set(key, result.body) // 성공만 캐시 (에러는 재조회 가능하게)
    const l = result.body.lunar
    console.log(
      `입력 ${year}-${month}-${day} → 음력 ${l.year}-${l.month}-${l.day}` +
        (l.leapMonth ? ' (윤달)' : '')
    )
  }
  res.status(result.status).json(result.body)
})

app.listen(PORT, () => {
  console.log(`server on http://localhost:${PORT}`)
})
