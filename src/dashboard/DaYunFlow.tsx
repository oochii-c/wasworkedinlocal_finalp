interface DaYun {
  ganZhi: string;
  startAge: number;
  startYear: number;
}

interface Props {
  daYun: DaYun[];
  birthYear: number;
}

const CURRENT_YEAR = 2026;

export default function DaYunFlow({ daYun, birthYear }: Props) {
  const currentAge = CURRENT_YEAR - birthYear;

  return (
    <section className="db-section" aria-label="대운 흐름">
      <h3 className="db-section-title">
        인생 흐름 (대운)
        <span className="db-section-sub">연도 탭 → 그 해 운세</span>
      </h3>
      {daYun.length === 0 ? (
        <p className="db-shensha-empty">대운 정보를 계산할 수 없습니다</p>
      ) : (
        <div className="db-dayun-list">
          {daYun.map((dy) => {
            const isCurrent = dy.startAge <= currentAge && currentAge < dy.startAge + 10;
            return (
              <div
                key={dy.startAge}
                className={`db-dayun-item${isCurrent ? " is-current" : ""}`}
              >
                <span className="db-dayun-gz">{dy.ganZhi}</span>
                <span className="db-dayun-age">{dy.startAge}세</span>
                <span className="db-dayun-year">{dy.startYear}년~</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
