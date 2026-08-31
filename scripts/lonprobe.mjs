/* 출생지 경도별 진태양시 보정 비교 (앱 코드 미수정, 읽기 전용 비교)
   사용: node lonprobe.mjs YYYY MM DD HH mm */
import { Solar } from "lunar-typescript";

const DST_PERIODS = [
  [[1948,6,1],[1948,9,13]],[[1949,4,3],[1949,9,11]],[[1950,4,1],[1950,9,10]],
  [[1951,5,6],[1951,9,9]],[[1955,5,5],[1955,9,9]],[[1956,5,20],[1956,9,30]],
  [[1957,5,5],[1957,9,22]],[[1958,5,4],[1958,9,21]],[[1959,5,3],[1959,9,20]],
  [[1960,5,1],[1960,9,18]],[[1987,5,10],[1987,10,11]],[[1988,5,8],[1988,10,9]],
];
const toN = (y,m,d) => y*10000 + m*100 + d;
const isDST = (y,m,d) => DST_PERIODS.some(([s,e]) => toN(y,m,d) >= toN(...s) && toN(y,m,d) < toN(...e));

function correct(y,mo,d,h,mi,offsetMin) {
  const dst = isDST(y,mo,d);
  const off = dst ? offsetMin - 60 : offsetMin;
  const t = new Date(new Date(y, mo-1, d, h, mi).getTime() + off*60000);
  return { y:t.getFullYear(), mo:t.getMonth()+1, d:t.getDate(), h:t.getHours(), mi:t.getMinutes(), dst, off };
}

function pillars(c) {
  const ec = Solar.fromYmdHms(c.y, c.mo, c.d, c.h, c.mi, 0).getLunar().getEightChar();
  return [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()];
}

const [y,mo,d,h,mi] = process.argv.slice(2).map(Number);
if ([y,mo,d,h,mi].some(Number.isNaN)) { console.error("사용: node lonprobe.mjs YYYY MM DD HH mm"); process.exit(1); }

const cases = [
  ["서울 -32 (현재 앱 값)", -32],
  ["부산 129.07E -24",      -24],
];

console.log(`입력 생년월일시: ${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")} ${String(h).padStart(2,"0")}:${String(mi).padStart(2,"0")}\n`);
const out = [];
for (const [label, off] of cases) {
  const c = correct(y,mo,d,h,mi,off);
  const p = pillars(c);
  out.push(p.join(" "));
  console.log(`${label}`);
  console.log(`  보정후: ${c.y}-${c.mo}-${c.d} ${String(c.h).padStart(2,"0")}:${String(c.mi).padStart(2,"0")}  (DST=${c.dst}, offset=${c.off}분)`);
  console.log(`  연 월 일 시: ${p.join("  ")}\n`);
}
console.log(out[0] === out[1] ? "==> 동일. 부산 보정 필요 없음." : "==> 다름! 시주 경계 걸림. 보정 필요.");

// 경계까지 여유
const c = correct(y,mo,d,h,mi,-32);
const minsIntoOddHour = ((c.h + 1) % 2) * 60 + c.mi;
console.log(`보정후 시각의 시주 경계까지 남은 시간: ${120 - minsIntoOddHour}분 (경계 지난 시간: ${minsIntoOddHour}분)`);
