/*
 * probe.mjs — lunar-typescript API 탐색 스크립트 (앱 미사용 · 개발 참고용)
 *
 * 실행: node scripts/probe.mjs
 * 용도: lunar-typescript(EightChar/Lunar)가 제공하는 값들을 콘솔로 확인한다.
 *   A. 원국(사주팔자) 기둥별 간지·오행·십신·납음·십이운성·공망
 *   B. 대운 / 유년(세운) 흐름
 *   C. 기간 운세 (오늘 일진·올해 세운·이번달 월운·띠)
 *   D. 신살·방위·택일 (충·살·길신·흉살·재물방위·좋은일/꺼릴일)
 *
 * 참고: C·D 섹션은 "오늘의 운세" 기능 구현 시 필요한 API 레퍼런스.
 */
import { Solar } from "lunar-typescript"

// 생일: 1990-02-03 22:58, 남자 (진태양시 보정 전)
const lunar = Solar.fromYmdHms(1990, 2, 3, 22, 58, 0).getLunar()
const ec = lunar.getEightChar()

const pillars = [
  ["연주", "Year"],
  ["월주", "Month"],
  ["일주", "Day"],
  ["시주", "Time"],
]

// ===== A. 원국 사주 (기둥별 전체) =====
console.log("\n========== A. 원국 사주 ==========")
for (const [ko, p] of pillars) {
  console.log(`\n--- ${ko} (${p}) ---`)
  console.log("간지     :", ec[`get${p}`]())
  console.log("천간     :", ec[`get${p}Gan`]())
  console.log("지지     :", ec[`get${p}Zhi`]())
  console.log("지장간   :", ec[`get${p}HideGan`]())        // 배열
  console.log("오행     :", ec[`get${p}WuXing`]())          // 2글자 붙어옴
  console.log("납음     :", ec[`get${p}NaYin`]())
  console.log("십신(간) :", ec[`get${p}ShiShenGan`]())
  console.log("십신(지) :", ec[`get${p}ShiShenZhi`]())      // 배열
  console.log("십이운성 :", ec[`get${p}DiShi`]())
  console.log("순       :", ec[`get${p}Xun`]())
  console.log("공망     :", ec[`get${p}XunKong`]())
}

console.log("\n--- 나 자신 & 특수점 ---")
console.log("일간(나) :", ec.getDayGan())
console.log("태원     :", ec.getTaiYuan(), "/ 납음:", ec.getTaiYuanNaYin())
console.log("태식     :", ec.getTaiXi(), "/ 납음:", ec.getTaiXiNaYin())
console.log("명궁     :", ec.getMingGong(), "/ 납음:", ec.getMingGongNaYin())
console.log("신궁     :", ec.getShenGong(), "/ 납음:", ec.getShenGongNaYin())

// 8자 한 번에 (배열)
console.log("\n--- 8자 배열 한방 ---")
console.log("바지     :", lunar.getBaZi())
console.log("바지오행 :", lunar.getBaZiWuXing())
console.log("바지납음 :", lunar.getBaZiNaYin())
console.log("바지십신간:", lunar.getBaZiShiShenGan())
console.log("바지십신지:", lunar.getBaZiShiShenZhi())

// ===== B. 운 흐름 =====
console.log("\n========== B. 운 흐름 ==========")
const yun = ec.getYun(1)   // 1=남자, 0=여자
console.log("대운 시작 :", yun.getStartSolar().toYmd(), "/ 순행?", yun.isForward())

const daYunList = yun.getDaYun()
console.log("대운 개수 :", daYunList.length)
const dy = daYunList[2]     // 3번째 대운 샘플
console.log(`\n--- 대운 샘플 (index 2) ---`)
console.log("나이     :", dy.getStartAge(), "~", dy.getEndAge())
console.log("연도     :", dy.getStartYear(), "~", dy.getEndYear())
console.log("간지     :", dy.getGanZhi())

const liuNian = dy.getLiuNian()       // 이 대운 안의 유년(1년) 배열
console.log("\n유년 개수 :", liuNian.length)
console.log("유년 샘플 :", liuNian[0].getYear(), liuNian[0].getAge(), liuNian[0].getGanZhi())
console.log("유월 샘플 :", liuNian[0].getLiuYue()[0].getGanZhi())  // 유년 안의 월운

// ===== C. 기간 운세 (오늘/올해/이번달) =====
console.log("\n========== C. 기간 운세 ==========")
const today = Solar.fromDate(new Date()).getLunar()
console.log("오늘 일진 :", today.getDayInGanZhi())
console.log("올해 세운 :", today.getYearInGanZhi())
console.log("이번달월운:", today.getMonthInGanZhi())
console.log("띠        :", today.getShengxiao())

// ===== D. 신살 / 방위 / 택일 (그날 기준) =====
console.log("\n========== D. 신살·방위·택일 (오늘 기준) ==========")
console.log("충        :", today.getDayChong(), "/", today.getDayChongDesc())
console.log("살        :", today.getDaySha())
console.log("길신      :", today.getDayJiShen())    // 배열
console.log("흉살      :", today.getDayXiongSha())  // 배열
console.log("십이신    :", today.getDayTianShen(), "(", today.getDayTianShenLuck(), ")")
console.log("건제12신  :", today.getZhiXing())
console.log("재물방위  :", today.getPositionCai())
console.log("희신방위  :", today.getPositionXi())
console.log("좋은일    :", today.getDayYi())        // 배열
console.log("꺼릴일    :", today.getDayJi())        // 배열
console.log("녹        :", today.getDayLu())