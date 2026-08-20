/* SectionHeader - 섹션 제목 */
interface SectionHeaderProps { title: string; sub?: string; }

export function SectionHeader({ title, sub }: SectionHeaderProps) {
  return (
    <div className="saju-section-title-row">
      <h3>{title}</h3>
      {sub && <span className="saju-title-sub">{sub}</span>}
    </div>
  );
}
