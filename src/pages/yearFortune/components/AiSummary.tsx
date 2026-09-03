import WhirlLoader from "../../../components/WhirlLoader";
import styles from "./AiSummary.module.css";

export interface AiSummaryProps {
  summary: string | null;
  loading?: boolean;
  error?: boolean;
}

export function AiSummary({ summary, loading = false, error = false }: AiSummaryProps) {
  // 총운은 두 문단으로 오므로 빈 줄 기준으로 나눠 문단마다 <p>로 렌더한다.
  const paragraphs = (summary ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <section className={styles.section} aria-label="총운">
      <h3 className={styles.heading}>총운</h3>
      {error ? (
        <p className={styles.notice}>풀이를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
      ) : loading && !summary ? (
        <p className={`${styles.text} ${styles.loading}`}>
          <WhirlLoader />용왕님이 올해의 흐름을 읽고 있어요…
        </p>
      ) : (
        <div style={{ opacity: loading ? 0.4 : 1, transition: "opacity 0.2s" }}>
          {paragraphs.map((p, i) => (
            <p key={i} className={styles.text}>
              {p}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
