// 서울 기준 진태양시(眞太陽時) 보정.
//
// KST(UTC+9)는 동경 135° 자오선 = 일본(아카시 부근) 기준이라, 서울(약 126.98°E)의
// 실제 태양시보다 시계가 앞선다. 135 - 126.98 = 8.02° × 4분/° ≈ 32분.
// 시주(時柱)는 태양시로 정하므로, 시계 시각에서 32분을 빼 진태양시로 맞춘다.
//
// 개인 출생지별 경도차와 균시차(±16분)는 의도적으로 무시한다 — 서울 고정, 단순화.
export const SEOUL_TRUE_SOLAR_OFFSET_MIN = -32

// 시계 시각(KST) → 서울 진태양시. 자정 근처면 날짜가 하루 넘어갈 수 있다(일주·시주 영향).
export function toSeoulTrueSolar(clock: Date): Date {
  return new Date(clock.getTime() + SEOUL_TRUE_SOLAR_OFFSET_MIN * 60_000)
}
