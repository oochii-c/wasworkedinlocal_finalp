import styles from "./StarRating.module.css";

export interface StarRatingProps {
  score: number;
}

export function StarRating({ score }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(score)));
  const stars = "★".repeat(clamped) + "☆".repeat(5 - clamped);
  return (
    <span className={styles.stars} aria-label={`${clamped}점 / 5점`}>
      {stars}
    </span>
  );
}
