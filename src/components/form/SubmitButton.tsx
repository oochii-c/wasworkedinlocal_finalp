/* SubmitButton - 제출 버튼 */
interface SubmitButtonProps { label?: string; icon?: string; disabled?: boolean; loading?: boolean; onClick?: () => void; }

export function SubmitButton({ label = "원국 생성", icon = "🐚", disabled, loading, onClick }: SubmitButtonProps) {
  return (
    <button type="submit" className="saju-submit-button" disabled={disabled || loading} onClick={onClick}>
      {loading ? "생성 중..." : (<><span>{icon}</span>{label}</>)}
    </button>
  );
}
