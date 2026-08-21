import styles from "./AiSummary.module.css";

export interface AiSummaryProps {
  summary: string;
}

export function AiSummary({ summary }: AiSummaryProps) {
  return (
    <section className={styles.section} aria-label="AI 총평">
      <h3 className={styles.heading}>AI 총평</h3>
      <p className={styles.text}>{summary}</p>
    </section>
  );
}
