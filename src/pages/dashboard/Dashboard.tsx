import "./dashboard.css";
import { type DashboardProps } from "./types";
import CharacterCard from "./CharacterCard";
import OriginChart from "./OriginChart";
import ElementStar from "./ElementStar";
import TenGodRadar from "./TenGodRadar";
import ShenShaList from "./ShenShaList";
import AiStories from "./AiStories";
import DaYunFlow from "./DaYunFlow";
import BottomNav from "../../components/layout/BottomNav";

export default function Dashboard(props: DashboardProps) {
  const { chart, stories, loading, onRetry, name, gender, date, time, timeUnknown, onBack } = props;

  return (
    <div className="db-page">
      {/* 상단 바 */}
      <header className="db-topbar">
        <span className="db-logo">용왕님 말씀</span>
        <button type="button" className="db-back-btn" onClick={onBack} aria-label="입력으로 돌아가기">
          ← 다시 입력
        </button>
      </header>

      <main className="db-main">
        {/* 블록 1: 캐릭터 */}
        <CharacterCard
          chart={chart}
          name={name}
          gender={gender}
          date={date}
          time={time}
          timeUnknown={timeUnknown}
        />

        {/* 블록 2: 원국 8글자 */}
        <OriginChart pillars={chart.pillars} />

        {/* 블록 3+4: 오행 & 십성 (2열 나란히) */}
        <div className="db-row2">
          <ElementStar wuXingCount={chart.wuXingCount} />
          <TenGodRadar shiShenCount={chart.shiShenCount} />
        </div>

        {/* 블록 5: 신살 */}
        <ShenShaList shenSha={chart.shenSha} />

        {/* 블록 6: AI 총운 */}
        <AiStories stories={stories} loading={loading} onRetry={onRetry} />

        {/* 블록 7: 대운 */}
        <DaYunFlow
          daYun={chart.daYun}
          seWun={chart.seWun}
          currentSeWun={chart.currentSeWun}
          birthYear={date.year}
          dayGan={chart.dayGan}
        />
      </main>

      {/* 하단 네비 */}
      <BottomNav />
    </div>
  );
}
