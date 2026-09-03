import styles from "./AiSummary.module.css";

export interface AiSummaryProps {
  summary: string | null;
  loading?: boolean;
  error?: boolean;
}

export function AiSummary({ summary, loading = false, error = false }: AiSummaryProps) {
  return (
    <section className={styles.section} aria-label="AI 총평">
      <h3 className={styles.heading}>AI 총평</h3>
      {error ? (
        <p className={styles.notice}>풀이를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
      ) : loading && !summary ? (
        <p className={`${styles.text} ${styles.loading}`}>용왕님이 올해의 흐름을 읽고 있어요…</p>
      ) : (
        <p
          className={styles.text}
          style={{ opacity: loading ? 0.4 : 1, transition: "opacity 0.2s" }}
        >
          {summary ?? ""}
        </p>
      )}
    </section>
  );
}
