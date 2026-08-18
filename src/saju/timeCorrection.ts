/* ============================================================
   한국 서머타임(DST) 및 서울 기준 진태양시(-32분) 보정
   ============================================================ */
export const DST_PERIODS = [
  { s: [1948, 6, 1],  e: [1948, 9, 13] },
  { s: [1949, 4, 3],  e: [1949, 9, 11] },
  { s: [1950, 4, 1],  e: [1950, 9, 10] },
  { s: [1951, 5, 6],  e: [1951, 9,  9] },
  { s: [1955, 5, 5],  e: [1955, 9,  9] },
  { s: [1956, 5, 20], e: [1956, 9, 30] },
  { s: [1957, 5, 5],  e: [1957, 9, 22] },
  { s: [1958, 5, 4],  e: [1958, 9, 21] },
  { s: [1959, 5, 3],  e: [1959, 9, 20] },
  { s: [1960, 5, 1],  e: [1960, 9, 18] },
  { s: [1987, 5, 10], e: [1987, 10, 11] },
  { s: [1988, 5, 8],  e: [1988, 10,  9] },
];

function toN(y: number, m: number, d: number) {
  return y * 10000 + m * 100 + d;
}

export function isDST(y: number, m: number, d: number): boolean {
  const n = toN(y, m, d);
  return DST_PERIODS.some(({ s, e }) => n >= toN(s[0], s[1], s[2]) && n < toN(e[0], e[1], e[2]));
}

export function correctToSaju(year: number, month: number, day: number, hour: number, minute: number) {
  let offsetMin = -32; // 서울(동경 127.5도) vs 동경(동경 135도) 기준시 편차
  const dstApplied = isDST(year, month, day);
  if (dstApplied) offsetMin -= 60;

  const baseMs = new Date(year, month - 1, day, hour, minute).getTime();
  const d = new Date(baseMs + offsetMin * 60 * 1000);

  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    dstApplied,
    offsetMin,
  };
}
