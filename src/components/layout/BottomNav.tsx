import { type ReactNode } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  center?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "홈",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 9v11a1 1 0 001 1h12a1 1 0 001-1V9" />
        <path d="M9 21v-7a1 1 0 011-1h4a1 1 0 011 1v7" />
      </svg>
    ),
  },
  {
    id: "today",
    label: "오늘운세",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
  },
  {
    id: "ai",
    label: "AI 상담",
    center: true,
    icon: (
      <div className="yeouiju-btn" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="aiSparkle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#FFF2B2" />
              <stop offset="70%" stopColor="#FFD67A" />
              <stop offset="100%" stopColor="#EACB8A" />
            </linearGradient>
            <radialGradient id="aiGlowCenter" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD875" stopOpacity="0.75" />
              <stop offset="55%" stopColor="#66B2D6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#134264" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* 중심 은은한 여의주 오라 */}
          <circle cx="12" cy="12" r="9.5" fill="url(#aiGlowCenter)" />
          {/* 곡선형 4각 지혜의 별빛 (AI & 여의주 광채) */}
          <path
            d="M12 2.5C12 7.75 7.75 12 2.5 12C7.75 12 12 16.25 12 21.5C12 16.25 16.25 12 21.5 12C16.25 12 12 7.75 12 2.5Z"
            fill="url(#aiSparkle)"
          />
          {/* 보조 작은 반짝임 */}
          <circle cx="18" cy="5.5" r="1.3" fill="#FFFFFF" opacity="0.95" />
          <circle cx="6" cy="17.5" r="1" fill="#FFE599" opacity="0.85" />
        </svg>
      </div>
    ),
  },
  {
    id: "topics",
    label: "주제별",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8M8 11h5" />
      </svg>
    ),
  },
  {
    id: "match",
    label: "궁합",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
];

interface BottomNavProps {
  active?: string;
  onSelect?: (id: string) => void;
}

export default function BottomNav({ active = "home", onSelect }: BottomNavProps) {
  return (
    <nav className="db-bottomnav" aria-label="하단 탭 네비게이션">
      {NAV_ITEMS.map(({ id, label, icon, center }) => {
        const isActive = active === id;
        return (
        <button
          key={id}
          type="button"
          className={[
            "db-navitem",
            isActive ? "is-active" : "",
            center ? "is-center" : "",
          ].filter(Boolean).join(" ")}
          aria-current={isActive ? "page" : undefined}
          aria-label={label}
          onClick={() => onSelect?.(id)}
        >
          <span className="db-nav-ico">{icon}</span>
          <span className="db-nav-label">{label}</span>
        </button>
        );
      })}
    </nav>
  );
}
