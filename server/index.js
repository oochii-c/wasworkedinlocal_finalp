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

// 양력 → 음력 변환
app.get('/api/lunar', async (req, res) => {
  const { year, month, day } = req.query
  if (!year || !month || !day) {
    return res.status(400).json({ error: 'year, month, day 필수' })
  }

  // serviceKey는 이미 URL-encoded 상태 → 재인코딩 금지, 문자열로 직접 붙임
  const url =
    `${KASI_BASE}/getLunCalInfo?serviceKey=${SERVICE_KEY}` +
    `&solYear=${year}&solMonth=${pad(month)}&solDay=${pad(day)}`

  try {
    const kasiRes = await fetch(url)
    const xml = await kasiRes.text()
    const parsed = parser.parse(xml)

    const header = parsed?.response?.header
    if (header?.resultCode !== '00') {
      return res
        .status(502)
        .json({ error: 'KASI 오류', code: header?.resultCode, msg: header?.resultMsg })
    }

    const item = parsed?.response?.body?.items?.item
    if (!item) return res.status(404).json({ error: '변환 결과 없음' })

    res.json({
      solar: { year: Number(year), month: Number(month), day: Number(day) },
      lunar: {
        year: item.lunYear,
        month: item.lunMonth,
        day: item.lunDay,
        leapMonth: item.lunLeapmonth === '윤', // 평/윤
      },
      raw: item,
    })
  } catch (err) {
    res.status(500).json({ error: '변환 실패', detail: String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`server on http://localhost:${PORT}`)
})
