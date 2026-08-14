/* ------------------------------------------------------------
   DropdownMenu : 13.svg (현재값 + 옵션 3개 고정 레이아웃)
   ※ svg 자체 구획(header 29.33% + item 22.67% x3)에 맞춰 설계되어
     기본은 옵션 3개 기준입니다. 개수를 바꾸려면 components.css의
     .dropdown-menu__item flex-basis 값도 함께 조정하세요.
   ------------------------------------------------------------ */
interface DropdownMenuProps {
  current: string;
  items: string[];
  onSelect: (value: string) => void;
}

export function DropdownMenu({ current, items, onSelect }: DropdownMenuProps) {
  return (
    <div className="dropdown-menu">
      <div className="dropdown-menu__current">{current}</div>
      {items.map((item) => (
        <div key={item} className="dropdown-menu__item" onClick={() => onSelect(item)}>
          {item}
        </div>
      ))}
    </div>
  );
}
