// server/prompts/index.js
// barrel — 프롬프트를 한 곳에서 가져다 쓰도록 재수출한다.
// import 하는 쪽(server/index.js, server/counsel.js)은 이 파일 하나만 본다.
export * from "./common.js";
export * from "./reading.js";
export * from "./themes.js";
export * from "./theme-detail.js";
export * from "./theme-combo.js";
export * from "./year-fortune.js";
export * from "./dayun-fortune.js";
export * from "./daily-fortune.js";
export * from "./daily-talisman.js";
export * from "./counsel.js";
