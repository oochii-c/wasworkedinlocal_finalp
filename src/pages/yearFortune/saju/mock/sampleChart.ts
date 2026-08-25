// 목업: 온보딩 폼이 아직 없어, 실제로는 온보딩 폼에서 생성될 SajuExtended를
// 대신하는 하드코딩된 데모 픽스처다.
import { SajuExtended } from "../types";

export const sampleChart: SajuExtended = {
  birthDate: "1998-04-12",
  calendarType: "solar",
  gender: "F",
  pillars: {
    year: { gan: "무", ji: "인" },
    month: { gan: "을", ji: "묘" },
    day: { gan: "경", ji: "진" },
    hour: { gan: "병", ji: "술" },
  },
  dayMaster: "경",
  ohaeng: { 목: 2, 화: 1, 토: 2, 금: 2, 수: 1 },
};
