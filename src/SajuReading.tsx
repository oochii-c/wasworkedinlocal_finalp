import type { SajuChart } from "./saju";

export interface Story {
  title: string;
  body: string;
}

interface SajuReadingProps {
  chart: SajuChart;
  stories: Story[];
  name: string;
  timeUnknown: boolean;
  onBack: () => void;
}

// 원국 4기둥 표. 행 = 항목, 열 = 기둥.
const ROWS: { label: string; get: (p: SajuChart["pillars"][number]) => string }[] = [
  { label: "천간", get: (p) => p.gan },
  { label: "지지", get: (p) => p.zhi },
  { label: "지장간", get: (p) => p.hideGan.join(" ") },
  { label: "십신(간)", get: (p) => p.shiShenGan },
  { label: "십신(지)", get: (p) => p.shiShenZhi.join(" ") },
  { label: "오행", get: (p) => p.wuXing },
  { label: "납음", get: (p) => p.naYin },
  { label: "십이운성", get: (p) => p.diShi },
  { label: "공망", get: (p) => p.xunKong },
];

export default function SajuReading({ chart, stories, name, timeUnknown, onBack }: SajuReadingProps) {
  return (
    <div className="saju-page">
      <header className="saju-header">
        <div className="saju-brand">용궁</div>
        <h1>{name ? `${name} 님의 사주 풀이` : "사주 풀이"}</h1>
        <p>일간 {chart.dayGan} · 띠 {chart.shengXiao}</p>
      </header>

      <section className="saju-section">
        {stories.map((s, i) => (
          <article key={i} className="saju-story">
            <h2 className="saju-story-title">{s.title}</h2>
            <p className="saju-story-body">{s.body}</p>
          </article>
        ))}
      </section>

      <section className="saju-section">
        <h2 className="saju-story-title">원국</h2>
        <table className="saju-chart-table">
          <thead>
            <tr>
              <th></th>
              {chart.pillars.map((p) => (
                <th key={p.key}>{p.key}주</th>
              ))}
            </tr>
            <tr>
              <th></th>
              {chart.pillars.map((p) => (
                <td key={p.key} className="saju-chart-ganzhi">{p.ganZhi}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th>{row.label}</th>
                {chart.pillars.map((p) => (
                  <td key={p.key}>{row.get(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {timeUnknown && (
          <div className="saju-info-note">시간 모름 — 시주는 참고용(자시 기준 계산)</div>
        )}
      </section>

      <button type="button" className="saju-submit-button" onClick={onBack}>
        ← 다시 입력
      </button>
    </div>
  );
}
