// server/counsel.js
// POST /api/counsel — 캐릭터 1:1 사주 상담 엔드포인트(캐릭터는 personaId 로 선택).
// express.Router 로 만들어 index.js 에는 mount(2줄)만 추가한다(공용 파일 최소 변경).
import express from "express";
import { chartToText, LANG_RULE } from "./prompt-utils.js";
import { COUNSEL_TASK, anchorLine, getPersona, PERSONA_SAFETY } from "./prompts/index.js";

const router = express.Router();

const MAX_INPUT = 500; // 사용자 질문 최대 길이(프롬프트 폭탄 방지)

router.post("/api/counsel", async (req, res) => {
  const API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY가 설정되지 않았습니다. server/.env를 확인하세요." });
  }

  const { chart, messages, personaId } = req.body || {};
  const persona = getPersona(personaId);
  if (!chart || !chart.pillars) return res.status(400).json({ error: "원국 데이터가 없습니다." });
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "질문이 없습니다." });
  }

  // 마지막 사용자 질문 길이 제한
  const lastUser = [...messages].reverse().find((m) => m.role === "me");
  if (lastUser && (lastUser.text || "").length > MAX_INPUT) {
    return res.status(400).json({ error: `질문은 ${MAX_INPUT}자 이내로 해주세요.` });
  }

  // 일간 anchor + 원국 컨텍스트
  const system = `${persona.identity}\n\n${PERSONA_SAFETY}\n\n${COUNSEL_TASK}\n\n${LANG_RULE}\n\n${anchorLine(chart.dayGan)}\n\n[사주 원국]\n${chartToText(chart)}`;

  // 대화 이력 → OpenRouter messages. 사용자 입력은 <user_question> 로 격리(주입 방어).
  // role "wang" = 캐릭터 측 발화(레거시 키). "me" = 사용자.
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

    // 형식 불량 시 캐릭터 톤 fallback
    if (!parsed || !parsed.reply) {
      return res.json({ reply: persona.fallback, src: "" });
    }

    res.json({ reply: parsed.reply, src: parsed.src || "" });
  } catch (e) {
    res.status(500).json({ error: "상담 생성 실패", detail: String(e) });
  }
});

export default router;
