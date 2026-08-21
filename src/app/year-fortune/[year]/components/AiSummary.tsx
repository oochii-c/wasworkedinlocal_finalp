import styles from "./AiSummary.module.css";

export interface AiSummaryProps {
  summary: string;
  citation?: string;
}

export function AiSummary({ summary, citation }: AiSummaryProps) {
  return (
    <section className={styles.section} aria-label="AI 총평">
      <h3 className={styles.heading}>AI 총평</h3>
      <p className={styles.text}>{summary}</p>
      {citation && <p className={styles.citation}>근거: {citation}</p>}
    </section>
  );
}
