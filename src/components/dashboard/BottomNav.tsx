interface NavItem {
  icon: string;
  label: string;
  active?: boolean;
  center?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "🏠", label: "홈", active: true },
  { icon: "🍀", label: "오늘운세" },
  { icon: "🔮", label: "AI상담", center: true },
  { icon: "🎯", label: "주제별" },
  { icon: "💕", label: "궁합" },
];

export default function BottomNav() {
  return (
    <nav className="db-bottomnav" aria-label="하단 탭 네비게이션">
      {NAV_ITEMS.map(({ icon, label, active, center }) => (
        <button
          key={label}
          type="button"
          className={[
            "db-navitem",
            active ? "is-active" : "",
            center ? "is-center" : "",
          ].filter(Boolean).join(" ")}
          aria-current={active ? "page" : undefined}
        >
          <span className="db-nav-ico">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
