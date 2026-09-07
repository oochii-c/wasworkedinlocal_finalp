import { Solar } from "lunar-typescript";
import { HANJA_TO_CHEON_GAN, HANJA_TO_JI_JI } from "./ganzhi";
import { GanZhi } from "./types";

/* 실제 절기(節) 기반 월주(月柱).
   해당 연·월의 15일(節 경계에서 충분히 떨어진 날) 팔자에서 월간지를 읽는다.
   lunar-typescript 는 한자를 주므로 이 모듈 밖에서 쓰는 한글 간지로 변환한다. */
export function getMonthInGanZhi(year: number, month: number): GanZhi {
  if (month < 1 || month > 12) {
    throw new Error(`month must be between 1 and 12, got ${month}`);
  }
  const ec = Solar.fromYmdHms(year, month, 15, 12, 0, 0).getLunar().getEightChar();
  return {
    gan: HANJA_TO_CHEON_GAN[ec.getMonthGan()],
    ji: HANJA_TO_JI_JI[ec.getMonthZhi()],
  };
}
