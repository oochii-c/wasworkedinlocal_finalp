# Form Component Pack (React + TypeScript / Vite)

## 폴더 구조

```
form-component-pack-react/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── src/
    ├── main.tsx                     # 엔트리포인트, 전역 css import
    ├── App.tsx                      # 사용 예시(데모 폼)
    ├── vite-env.d.ts
    ├── components/                  # ★ 컴포넌트별 파일 분리
    │   ├── index.ts                 #   barrel export (한 줄 import용)
    │   ├── types.ts                 #   공유 타입(SelectOption, RadioOption)
    │   ├── FormField.tsx
    │   ├── FormLabel.tsx
    │   ├── TextInput.tsx
    │   ├── SelectField.tsx
    │   ├── Segment.tsx
    │   ├── RadioGroup.tsx
    │   └── DropdownMenu.tsx
    ├── styles/
    │   ├── variables.css            # 색상 + aspect-ratio 토큰
    │   ├── base.css
    │   ├── components.css           # 핵심 스타일 (기존과 동일한 반응형 로직)
    │   └── responsive.css
    └── assets/svg/                  # 업로드하신 16개 svg 원본
```

## 실행 방법 (VS Code)

```bash
npm install
npm run dev       # http://localhost:5173
```

빌드 검증: `npm run build` (tsc + vite build, 이미 로컬에서 정상 빌드 확인함)

## `src/components/` 안의 파일 목록

컴포넌트마다 파일을 분리했고, `index.ts`에서 barrel export로 모아뒀습니다.
`App.tsx`에서는 `import { TextInput, SelectField, ... } from "./components"`
한 줄로 전부 불러올 수 있습니다.

| 컴포넌트 | 대응 SVG | 설명 |
|---|---|---|
| `FormField` | - | label + control + help 텍스트 래퍼 |
| `FormLabel` | 16 | 라벨/배지 |
| `TextInput` | 01 / 02 / 03 | default / focus / error, blur 시 required 검증 |
| `SelectField` | 04 / 05 + 09 / 06 / 07 / 08 | 닫힘/열림 + 옵션 리스트(선택/비활성 포함) |
| `Segment` | 10 / 11 / 12 | 2단 토글 (좌/우 선택) |
| `RadioGroup` | 14 / 15 | 라디오 옵션 목록 |
| `DropdownMenu` | 13 | 현재값 + 옵션 3개 고정 레이아웃 |

모든 컴포넌트는 **props로 상태(value)를 받고 onChange로 상위에 알리는 controlled
컴포넌트** 패턴입니다. 실제 폼 상태는 `App.tsx`에서 `useState`로 관리합니다.

## 반응형 원칙 (기존과 동일, CSS는 그대로 재사용)

- 모든 컨트롤 폭은 100%, 높이는 `aspect-ratio`로 원본 SVG 비율을 고정
  (`preserveAspectRatio="none"` SVG가 폭에 맞춰 늘어나도 찌그러지지 않음)
- 내부 텍스트 위치는 px 대신 SVG 내부 좌표를 %로 환산한 값 사용
- 상태(focus/error/selected/open/disabled)는 className만 바뀌고
  `background-image`가 다른 svg로 교체되는 방식 → React에서는 state에 따라
  className 문자열만 조립하면 됨 (`FormComponents.tsx` 내부 로직 참고)

## 새 필드 추가하는 법

`App.tsx`에서 `FormField`로 감싸고 원하는 컨트롤을 넣으면 됩니다.

```tsx
<FormField label="이메일" htmlFor="email">
  <TextInput id="email" type="email" value={email} onChange={setEmail} />
</FormField>
```

## 커스터마이징

- 색상 전체 톤: `src/styles/variables.css`의 `--c-*`
- 폼 최대폭: `src/styles/responsive.css`의 `.form-wrap { max-width: 640px; }`
- 드롭다운(13) 옵션 개수를 3개가 아닌 다른 개수로 쓰려면
  `components.css`의 `.dropdown-menu__item` flex-basis %를 svg 구분선
  위치에 맞춰 재계산하세요.
