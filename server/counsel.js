// server/counsel.js
// POST /api/counsel — 용왕 1:1 사주 상담 엔드포인트.
// express.Router 로 만들어 index.js 에는 mount(2줄)만 추가한다(공용 파일 최소 변경).
import express from "express";
import { WANG_PERSONA, chartToCounselText, LANG_RULE } from "./prompt-utils.js";
import { COUNSEL_TASK, anchorLine } from "./prompts/index.js";

const router = express.Router();

const MAX_INPUT = 500; // 사용자 질문 최대 길이(프롬프트 폭탄 방지)

// ── 하루 상담 횟수 제한 (인메모리 · 서버 재시작 시 리셋) ──
// 실제 강제는 서버가, 표시는 클라이언트 뱃지가 담당.
const DAILY_LIMIT = Number(process.env.COUNSEL_DAILY_LIMIT) || 5;
const usage = new Map(); // ip -> { date, count }

function useOneTurn(ip) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const rec = usage.get(ip);
  if (!rec || rec.date !== today) {
    usage.set(ip, { date: today, count: 1 });
    return { ok: true, remaining: DAILY_LIMIT - 1 };
  }
  if (rec.count >= DAILY_LIMIT) return { ok: false, remaining: 0 };
  rec.count += 1;
  return { ok: true, remaining: DAILY_LIMIT - rec.count };
}

router.post("/api/counsel", async (req, res) => {
  const API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY가 설정되지 않았습니다. server/.env를 확인하세요." });
  }

  const { chart, messages } = req.body || {};
  if (!chart || !chart.pillars) return res.status(400).json({ error: "원국 데이터가 없습니다." });
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "질문이 없습니다." });
  }

  // 마지막 사용자 질문 길이 제한
  const lastUser = [...messages].reverse().find((m) => m.role === "me");
  if (lastUser && (lastUser.text || "").length > MAX_INPUT) {
    return res.status(400).json({ error: `질문은 ${MAX_INPUT}자 이내로 해주세요.` });
  }

  // 하루 횟수 제한
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const limit = useOneTurn(ip);
  if (!limit.ok) {
    return res.status(429).json({ error: "오늘의 상담을 모두 나누었네. 내일 다시 찾아오게." });
  }

  // 일간 anchor + 원국 컨텍스트
  const system = `${WANG_PERSONA}\n\n${COUNSEL_TASK}\n\n${LANG_RULE}\n\n${anchorLine(chart.dayGan)}\n\n[사주 원국]\n${chartToCounselText(chart)}`;

  // 대화 이력 → OpenRouter messages. 사용자 입력은 <user_question> 로 격리(주입 방어).
  const history = messages.map((m) =>
    m.role === "wang"
      ? { role: "assistant", content: m.text }
      : { role: "user", content: `<user_question>\n${m.text}\n</user_question>` }
  );

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: system }, ...history],
        response_format: { type: "json_object" },
        temperature: 0.9,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: `OpenRouter 오류 (${r.status})`, detail });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // JSON 파싱(+ 코드블록 등으로 감싼 경우 대비)
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    // 형식 불량 시 용왕 톤 fallback
    if (!parsed || !parsed.reply) {
      return res.json({
        reply: "짐이 지금은 그 뜻을 헤아리기 어렵구나. 잠시 후 다시 물어보게.",
        src: "",
        remaining: limit.remaining,
      });
    }

    res.json({ reply: parsed.reply, src: parsed.src || "", remaining: limit.remaining });
  } catch (e) {
    res.status(500).json({ error: "상담 생성 실패", detail: String(e) });
  }
});

export default router;
